import { Readable } from "node:stream";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Client, FTPError } from "basic-ftp";
import { getMediaStorageConfig, type MediaStorageConfig } from "@/lib/media-config";

export interface MediaStorageStat {
  size: number;
}

export interface MediaStorageAdapter {
  readonly backend: "local" | "hostinger";
  upload(relativePath: string, buffer: Buffer): Promise<void>;
  exists(relativePath: string): Promise<boolean>;
  delete(relativePath: string): Promise<boolean>;
  stat(relativePath: string): Promise<MediaStorageStat | null>;
  ensureDirectory(relativeDirectory: string): Promise<void>;
}

function normalizeRelativePath(value: string) {
  const normalized = value.replace(/\\/g, "/").replace(/^\/+/, "");
  const segments = normalized.split("/");
  if (!normalized || segments.some((segment) => !segment || segment === "." || segment === "..")) {
    throw new Error("Ruta multimedia inválida.");
  }
  return segments.join("/");
}

function normalizeRelativeDirectory(value: string) {
  if (!value || value === ".") return "";
  return normalizeRelativePath(value.replace(/\/+$/, ""));
}

function safeLocalPath(root: string, relativePath: string) {
  const rootPath = path.resolve(root);
  const absolutePath = path.resolve(rootPath, ...normalizeRelativePath(relativePath).split("/"));
  if (!absolutePath.startsWith(`${rootPath}${path.sep}`)) throw new Error("Ruta multimedia fuera del almacenamiento configurado.");
  return absolutePath;
}

export class LocalMediaStorage implements MediaStorageAdapter {
  readonly backend = "local" as const;
  constructor(private readonly root: string) {}

  async ensureDirectory(relativeDirectory: string) {
    const directory = normalizeRelativeDirectory(relativeDirectory);
    const target = directory ? safeLocalPath(this.root, `${directory}/.keep`) : path.resolve(this.root);
    await mkdir(directory ? path.dirname(target) : target, { recursive: true });
  }

  async upload(relativePath: string, buffer: Buffer) {
    const target = safeLocalPath(this.root, relativePath);
    await mkdir(path.dirname(target), { recursive: true });
    try {
      await writeFile(target, buffer, { flag: "wx" });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      const existing = await readFile(target);
      if (!existing.equals(buffer)) throw new Error("La ruta hash ya existe con contenido diferente.");
    }
  }

  async stat(relativePath: string) {
    try {
      const info = await stat(safeLocalPath(this.root, relativePath));
      return info.isFile() ? { size: info.size } : null;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }

  async exists(relativePath: string) {
    return Boolean(await this.stat(relativePath));
  }

  async delete(relativePath: string) {
    const target = safeLocalPath(this.root, relativePath);
    if (!(await this.exists(relativePath))) return false;
    await rm(target, { force: true });
    return true;
  }
}

type FtpConfig = NonNullable<MediaStorageConfig["ftp"]>;

function isMissingFtpPath(error: unknown) {
  return error instanceof FTPError && error.code === 550;
}

function remotePath(relativePath: string) {
  return normalizeRelativePath(relativePath);
}

export class HostingerMediaStorage implements MediaStorageAdapter {
  readonly backend = "hostinger" as const;
  constructor(private readonly config: FtpConfig) {}

  private async withClient<T>(operation: string, callback: (client: Client) => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= this.config.retries; attempt += 1) {
      const client = new Client(this.config.timeoutMs);
      client.ftp.verbose = false;
      try {
        await client.access({
          host: this.config.host,
          port: this.config.port,
          user: this.config.user,
          password: this.config.password,
          secure: this.config.secure,
          secureOptions: this.config.secure ? {
            rejectUnauthorized: true,
            ...(this.config.tlsServername ? { servername: this.config.tlsServername } : {}),
          } : undefined,
        });
        await client.cd(this.config.root);
        return await callback(client);
      } catch (error) {
        lastError = error;
        if (isMissingFtpPath(error) || attempt >= this.config.retries) break;
      } finally {
        client.close();
      }
    }
    const message = lastError instanceof Error ? lastError.message : "error de red desconocido";
    throw new Error(`Falló ${operation} en el almacenamiento remoto: ${message}`);
  }

  async ensureDirectory(relativeDirectory: string) {
    const directory = normalizeRelativeDirectory(relativeDirectory);
    if (!directory) return;
    await this.withClient("la creación del directorio", async (client) => {
      await client.ensureDir(directory);
    });
  }

  async upload(relativePath: string, buffer: Buffer) {
    const target = remotePath(relativePath);
    const directory = path.posix.dirname(target);
    await this.withClient("el upload", async (client) => {
      if (directory !== ".") await client.ensureDir(directory);
      const filename = path.posix.basename(target);
      const existingSize = await client.size(filename).catch((error: unknown) => {
        if (isMissingFtpPath(error)) return -1;
        throw error;
      });
      if (existingSize >= 0) {
        if (existingSize !== buffer.length) throw new Error("La ruta hash remota ya existe con un tamaño diferente.");
        return;
      }
      await client.uploadFrom(Readable.from(buffer), filename);
      const uploadedSize = await client.size(filename);
      if (uploadedSize !== buffer.length) throw new Error("El archivo remoto no coincide con el tamaño esperado.");
    });
  }

  async stat(relativePath: string) {
    const target = remotePath(relativePath);
    return this.withClient("la consulta del archivo", async (client) => {
      try {
        return { size: await client.size(target) };
      } catch (error) {
        if (isMissingFtpPath(error)) return null;
        throw error;
      }
    });
  }

  async exists(relativePath: string) {
    return Boolean(await this.stat(relativePath));
  }

  async delete(relativePath: string) {
    const target = remotePath(relativePath);
    return this.withClient("la eliminación del archivo", async (client) => {
      try {
        await client.remove(target);
        return true;
      } catch (error) {
        if (isMissingFtpPath(error)) return false;
        throw error;
      }
    });
  }
}

export function getMediaStorageAdapter(): MediaStorageAdapter {
  const config = getMediaStorageConfig();
  if (config.backend === "hostinger") return new HostingerMediaStorage(config.ftp!);
  return new LocalMediaStorage(config.storageRoot);
}
