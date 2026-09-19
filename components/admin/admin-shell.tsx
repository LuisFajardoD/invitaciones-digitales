"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type AdminShellProps = {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export function AdminShell({ title, description, actions, children }: AdminShellProps) {
  const pathname = usePathname() || "";

  const isDemosActive = pathname.startsWith("/admin/demos");
  const isInvitationsActive = pathname.startsWith("/admin/invitations") && !isDemosActive;
  const isSiteActive = pathname.startsWith("/admin/site");
  const isMediaActive = pathname.startsWith("/admin/media");
  const isIntakesActive = pathname.startsWith("/admin/intakes");

  return (
    <div className="app-admin gloobi-crm-wrapper">
      {/* Top Header Navigation */}
      <header className="gloobi-crm-header">
        <div className="gloobi-crm-header-inner">
          <div className="gloobi-crm-brand">
            <Link href="/admin/invitations" className="gloobi-crm-logo-link">
              <svg className="gloobi-crm-logo-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
              </svg>
              <span className="gloobi-crm-logo-title">Gloobi <span className="gloobi-crm-badge-pro">CRM Pro</span></span>
            </Link>
          </div>

          <nav className="gloobi-crm-nav" aria-label="Navegación principal del CRM">
            <Link
              href="/admin/demos"
              className={`gloobi-crm-nav-item ${isDemosActive ? "is-active" : ""}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span>Demos</span>
            </Link>

            <Link
              href="/admin/invitations"
              className={`gloobi-crm-nav-item ${isInvitationsActive ? "is-active" : ""}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <span>Invitaciones</span>
            </Link>

            <Link
              href="/admin/site"
              className={`gloobi-crm-nav-item ${isSiteActive ? "is-active" : ""}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
              <span>Sitio Web Público</span>
            </Link>

            <Link
              href="/admin/media"
              className={`gloobi-crm-nav-item ${isMediaActive ? "is-active" : ""}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <span>Multimedia</span>
            </Link>

            <Link
              href="/admin/intakes"
              className={`gloobi-crm-nav-item ${isIntakesActive ? "is-active" : ""}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <span>Formularios de Datos</span>
            </Link>
          </nav>

          <div className="gloobi-crm-actions">
            <Link href="/" target="_blank" rel="noopener noreferrer" className="gloobi-crm-btn-ghost" title="Abrir sitio web público en vivo">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
              <span>Ver Sitio</span>
            </Link>

            <a href="/api/admin/logout" className="gloobi-crm-btn-logout" title="Cerrar sesión de administrador">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </a>
          </div>
        </div>
      </header>

      {/* Page Title & Context Header if title is provided */}
      {title && (
        <div className="gloobi-crm-page-header">
          <div className="gloobi-crm-page-header-inner">
            <div>
              <h1 className="gloobi-crm-page-title">{title}</h1>
              {description && <p className="gloobi-crm-page-description">{description}</p>}
            </div>
            {actions && <div className="gloobi-crm-page-actions">{actions}</div>}
          </div>
        </div>
      )}

      {/* Main Content Workspace */}
      <main className="gloobi-crm-main">
        {children}
      </main>
    </div>
  );
}
