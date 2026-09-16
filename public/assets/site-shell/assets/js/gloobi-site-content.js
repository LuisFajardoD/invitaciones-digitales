(function () {
  "use strict";

  function text(selector, value, root) {
    if (value === undefined || value === null || value === "") return;
    var node = (root || document).querySelector(selector);
    if (node) node.textContent = value;
  }
  function attr(selector, name, value, root) {
    if (!value) return;
    var node = (root || document).querySelector(selector);
    if (node && node.getAttribute(name) !== String(value)) node.setAttribute(name, value);
  }
  function section(page, id) { return page && page.sections && page.sections.find(function (item) { return item.id === id; }); }
  function visibility(selector, config) {
    var node = document.querySelector(selector);
    if (node && config) node.hidden = config.enabled === false;
  }
  function applyGlobalBackground(config) {
    if (!config) return;
    window.dispatchEvent(new CustomEvent("gloobi-site-background-change", { detail: { scope: "global", dark: config.background_dark_url, light: config.background_light_url } }));
  }
  function replaceHeroTitle(value) {
    var title = document.querySelector(".gloobi-hero-title");
    if (!title || !value) return;
    var currentValue = (title.getAttribute("aria-label") || title.textContent || "").replace(/\s+/g, " ").trim();
    if (currentValue !== value.replace(/\s+/g, " ").trim()) {
      title.replaceChildren();
      Array.from(value).forEach(function (character) {
        var span = document.createElement("span");
        span.className = character === " " ? "gloobi-hero-title-space" : "gloobi-hero-title-letter";
        span.textContent = character === " " ? "\u00a0" : character;
        title.appendChild(span);
      });
    }
    title.setAttribute("aria-label", value);
    window.dispatchEvent(new CustomEvent("gloobi-hero-title-change"));
  }
  function loadHeroVideo(source) {
    var video = document.querySelector("#hero .gloobi-season-video");
    if (!video || !source) return;
    video.dataset.ready = "false";
    video.addEventListener("loadeddata", function () { video.dataset.ready = "true"; }, { once: true });
    if (video.getAttribute("src") !== source) {
      video.src = source;
      video.load();
    } else if (video.readyState >= 2) {
      video.dataset.ready = "true";
    }
  }
  function applyHome(page, blocks) {
    var hero = section(page, "hero");
    visibility("#hero", hero); text("#hero .gloobi-kicker", hero && hero.eyebrow); replaceHeroTitle(hero && hero.title);
    text("#hero .gloobi-card-right-message", hero && hero.description);
    if (hero && hero.video_url) loadHeroVideo(hero.video_url);
    if (hero) window.dispatchEvent(new CustomEvent("gloobi-site-background-change", { detail: { scope: "panel", dark: hero.background_dark_url, light: hero.background_light_url } }));
    applyGlobalBackground(section(page, "background"));

    var categories = section(page, "categories"); visibility("#categorias", categories);
    document.querySelectorAll("#categorias .gloobi-category-card").forEach(function (card, index) { var item = categories && categories.items && categories.items[index]; if (!item) return; text("strong", item.title, card); attr("img", "src", item.image_url, card); attr("img", "alt", item.title, card); });
    var comparison = section(page, "comparison"); visibility("#comparativa", comparison); text("#comparativa h2", comparison && comparison.title); attr("#comparativa .gloobi-comparison__img", "src", comparison && comparison.image_url); var comparisonFrame = document.querySelector("#comparativa iframe"); if (comparisonFrame && comparison && comparison.cta_href) { if (comparisonFrame.getAttribute("src")) { if (comparisonFrame.getAttribute("src") !== comparison.cta_href) comparisonFrame.setAttribute("src", comparison.cta_href); } else { comparisonFrame.dataset.src = comparison.cta_href; } }
    var demos = section(page, "demos"); visibility("#demos", demos); text("#demos .sec-title", demos && demos.title); text("#demos .title-area p", demos && demos.description);
    document.querySelectorAll("#demos .gloobi-demo-card").forEach(function (card, index) { var item = demos && demos.items && demos.items[index]; if (!item) { card.hidden = true; return; } card.hidden = false; var slug = item.slug || ((item.href || "").match(/^\/i\/([^/?#]+)/) || [])[1] || ""; var source = item.href || (slug ? "/i/" + encodeURIComponent(slug) : ""); var frame = card.querySelector("iframe"); if (frame && source) { if (frame.getAttribute("src")) { if (frame.getAttribute("src") !== source) frame.setAttribute("src", source); } else { frame.dataset.src = source; } frame.title = item.title || "Demo Web Premium"; } text(".gloobi-demo-copy span", "Web Premium", card); text(".gloobi-demo-copy h3", item.title, card); text(".gloobi-demo-copy p", item.description, card); attr(".gloobi-demo-copy a", "href", source, card); });
    var benefits = section(page, "benefits"); visibility("#case-studies-sec", benefits); text("#case-studies-sec .sec-title", benefits && benefits.title); text("#case-studies-sec .title-area p", benefits && benefits.description);
    document.querySelectorAll("#case-studies-sec .service-grid").forEach(function(card,index){var item=benefits&&benefits.items&&benefits.items[index];if(!item)return;text(".box-title a",item.title,card);text(".box-text",item.description,card);attr("img","src",item.image_url,card);attr(".box-title a","href",item.href,card);});
    var sharing = section(page, "sharing"); visibility(".video-area",sharing); text(".video-area .sec-title", sharing && sharing.title); text(".video-area .title-area p", sharing && sharing.description); if(sharing&&sharing.background_dark_url){var sharingRoot=document.querySelector(".video-area");if(sharingRoot){sharingRoot.style.backgroundImage="url('"+sharing.background_dark_url.replace(/'/g,"%27")+"')";}} if(sharing&&sharing.video_url){document.querySelectorAll(".video-area video").forEach(function(video){video.src=sharing.video_url;video.load();});} document.querySelectorAll(".video-area .video-thumb-img img, .video-area .video-thumb-img2 img").forEach(function(image,index){var item=sharing&&sharing.items&&sharing.items[index];if(item&&item.image_url){image.src=item.image_url;image.alt=item.title||"Imagen de la invitación";}});
    var visualGallery=section(page,"visual_gallery"); visibility("#galeria",visualGallery); document.querySelectorAll("#galeria .gloobi-featured-gallery-link").forEach(function(link,index){var item=visualGallery&&visualGallery.items&&visualGallery.items[index];if(!item)return;attr("img","src",item.image_url,link);attr("img","alt",item.title,link);if(item.href)link.href=item.href;link.setAttribute("aria-label",item.title||"Abrir invitación");});
    var celebrations = section(page, "celebrations"); visibility("#celebration-categories", celebrations); text("#celebration-categories-title", celebrations && celebrations.title); text("#celebration-categories .gloobi-celebration-heading > p", celebrations && celebrations.description); text("#celebration-categories .gloobi-celebration-cta", celebrations && celebrations.cta_text); attr("#celebration-categories .gloobi-celebration-cta", "href", celebrations && celebrations.cta_href);
    document.querySelectorAll("#celebration-categories .gloobi-celebration-card").forEach(function(card,index){var item=celebrations&&celebrations.items&&celebrations.items[index];if(!item)return;text(".gloobi-celebration-name",item.title,card);attr("img","src",item.image_url,card);attr("img","alt",item.title,card);if(item.href)card.href=item.href;});
    var pricing = section(page, "pricing"); visibility("#pricing-sec", pricing); text("#pricing-sec .title-area .sec-title", pricing && pricing.title); text("#pricing-sec .title-area > p", pricing && pricing.description);
    document.querySelectorAll("#monthly .gloobi-price-col .price-box").forEach(function (card, index) { var item = blocks.packages.items[index]; if (!item) return; text(".box-title", item.name, card); text(".box-text", item.description, card); text(".box-price", item.price, card); var list = card.querySelector(".available-list ul"); if (list) { list.replaceChildren(); (item.features || []).forEach(function (feature) { var li = document.createElement("li"); li.textContent = feature; list.appendChild(li); }); } });
    var process = section(page, "process"); visibility("#proceso", process); text("#gloobi-process-title", process && process.title); text("#proceso .gloobi-process__header p", process && process.description); document.querySelectorAll("#proceso .gloobi-process__node:not(.gloobi-process__decision):not(.gloobi-process__node--adjust):not(.gloobi-process__node--changes)").forEach(function (node, index) { var item = process && process.items && process.items[index]; if (!item) return; text("h3", item.title, node); text("p", item.description, node); });
    var message = section(page, "message"); visibility("#mensaje", message); if (message && message.video_url) { var memoryVideo = document.querySelector("#mensaje video"); if (memoryVideo) { memoryVideo.src = message.video_url; if (message.image_url) memoryVideo.poster = message.image_url; memoryVideo.load(); } }
    applyFooter(section(page, "footer"));
  }
  function applyFooter(config) { if (!config) return; visibility("#footer",config); text("#footer .footer-top .box-title", config.title); text("#footer .about-text", config.description); if (config.image_url) { var footer = document.querySelector("#footer"); if (footer) { footer.setAttribute("data-bg-src", config.image_url); footer.style.backgroundImage = "url('" + config.image_url.replace(/'/g, "%27") + "')"; } } }
  function applyAbout(page) {
    [["hero",".gloobi-about-hero"],["purpose",".gloobi-about-purpose"],["principles",".gloobi-about-principles"],["behind",".gloobi-about-behind"],["gallery",".gloobi-about-gallery"],["cta",".gloobi-about-cta"]].forEach(function (entry) { var config=section(page,entry[0]), root=document.querySelector(entry[1]); if(!root||!config)return; root.hidden=config.enabled===false; text(".gloobi-about-kicker",config.eyebrow,root); text("h1, h2",config.title,root); text(".gloobi-about-lead, .gloobi-about-section-heading > p:last-child, .gloobi-behind-subtitle, .gloobi-about-cta-card > div > p:last-child",config.description,root); attr("img","src",config.image_url,root); text(".th-btn",config.cta_text,root); attr(".th-btn","href",config.cta_href,root); });
    var hero=section(page,"hero"), purpose=section(page,"purpose"), principles=section(page,"principles"), gallery=section(page,"gallery");
    applyGlobalBackground(hero);
    document.querySelectorAll(".gloobi-about-purpose-media img").forEach(function(image,index){var item=purpose&&purpose.items&&purpose.items[index];if(item&&item.image_url){image.src=item.image_url;image.alt=item.title||"Imagen de Gloobi";}});
    document.querySelectorAll(".gloobi-principles-grid article").forEach(function(card,index){var item=principles&&principles.items&&principles.items[index];if(!item){card.hidden=true;return;}card.hidden=false;text("h3",item.title,card);text("p",item.description,card);});
    var wrapper=document.querySelector(".gloobi-about-gallery-swiper .swiper-wrapper");
    if(wrapper&&gallery&&gallery.items){wrapper.replaceChildren();gallery.items.forEach(function(item){if(!item.image_url)return;var slide=document.createElement("div"),image=document.createElement("img");slide.className="swiper-slide";image.src=item.image_url;image.alt=item.title||"Celebración";slide.appendChild(image);wrapper.appendChild(slide);});if(wrapper.parentElement&&wrapper.parentElement.swiper)wrapper.parentElement.swiper.update();}
    applyFooter(section(page,"footer"));
  }
  function applyFaq(page) {
    var hero=section(page,"hero"), intro=section(page,"intro"), questions=section(page,"questions"), contact=section(page,"contact");
    text(".gloobi-faq-hero .gloobi-about-kicker",hero&&hero.eyebrow); text(".gloobi-faq-hero h1",hero&&hero.title); text(".gloobi-faq-hero .gloobi-about-lead",hero&&hero.description);
    text(".gloobi-faq-intro .gloobi-about-kicker",intro&&intro.eyebrow); text(".gloobi-faq-intro h2",intro&&intro.title); text(".gloobi-faq-intro > p:last-of-type",intro&&intro.description);
    visibility(".gloobi-faq-hero",hero); visibility(".gloobi-faq-intro",intro); visibility(".gloobi-faq-list",questions); visibility(".gloobi-faq-contact",contact); applyGlobalBackground(hero);
    var list=document.querySelector(".gloobi-faq-list");
    if(list&&questions&&questions.items){list.replaceChildren();questions.items.forEach(function(faq,index){var item=document.createElement("article"),heading=document.createElement("h3"),button=document.createElement("button"),symbol=document.createElement("span"),answer=document.createElement("div"),paragraph=document.createElement("p"),id="faq-answer-"+(index+1);item.className="gloobi-faq-item"+(index===0?" is-open":"");button.type="button";button.setAttribute("aria-expanded",String(index===0));button.setAttribute("aria-controls",id);button.id="faq-question-"+(index+1);button.appendChild(document.createTextNode(faq.title||"Pregunta"));symbol.setAttribute("aria-hidden","true");symbol.textContent=index===0?"−":"+";button.appendChild(symbol);heading.appendChild(button);answer.id=id;answer.setAttribute("role","region");answer.setAttribute("aria-labelledby",button.id);answer.hidden=index!==0;paragraph.textContent=faq.description||"";answer.appendChild(paragraph);item.appendChild(heading);item.appendChild(answer);list.appendChild(item);});}
    text(".gloobi-faq-contact .gloobi-about-kicker",contact&&contact.eyebrow); text(".gloobi-faq-contact h2",contact&&contact.title); text(".gloobi-faq-contact-card p:last-of-type",contact&&contact.description); text(".gloobi-faq-contact .th-btn",contact&&contact.cta_text); attr(".gloobi-faq-contact .th-btn","href",contact&&contact.cta_href); applyFooter(section(page,"footer"));
  }
  function applyContact(page, blocks) {
    var hero=section(page,"hero"), channels=section(page,"channels"), form=section(page,"form"); visibility(".gloobi-contact-hero",hero); visibility(".gloobi-contact-options",channels); visibility("#contacto",form); applyGlobalBackground(hero); text(".gloobi-contact-hero .gloobi-about-kicker",hero&&hero.eyebrow); text(".gloobi-contact-hero h1",hero&&hero.title); text(".gloobi-contact-hero .gloobi-about-lead",hero&&hero.description);
    document.querySelectorAll(".gloobi-contact-options-grid article").forEach(function(card,index){var item=channels&&channels.items&&channels.items[index];if(!item){card.hidden=true;return;}card.hidden=false;text("h2",item.title,card);text("p",item.description,card);attr("a","href",item.href,card);});
    text("#contacto .title",form&&form.title); text("#contacto .box-text",form&&form.description); text("#contacto button.th-btn",form&&form.cta_text); if(form&&form.background_dark_url){var contact=document.querySelector("#contacto");if(contact){contact.setAttribute("data-bg-src",form.background_dark_url);contact.style.backgroundImage="url('"+form.background_dark_url.replace(/'/g,"%27")+"')";}}
    var number=(blocks.contact.whatsapp_number||"").replace(/\D/g,""); document.querySelectorAll('a[href*="wa.me"], form[action*="wa.me"]').forEach(function(node){node.setAttribute(node.tagName==="FORM"?"action":"href","https://wa.me/"+number);}); attr('#contacto input[name="text"]',"value",blocks.contact.whatsapp_prefill_text);
    applyFooter(section(page,"footer"));
  }
  fetch("/api/public/site", { credentials: "same-origin" }).then(function(response){ if(!response.ok) throw new Error(); return response.json(); }).then(function(data){
    if(document.querySelector("#hero")) applyHome(data.pages.home,data.blocks);
    else if(document.querySelector(".gloobi-about")) applyAbout(data.pages.about);
    else if(document.querySelector(".gloobi-faq-page")) applyFaq(data.pages.faq);
    else if(document.querySelector(".gloobi-contact-page")) applyContact(data.pages.contact,data.blocks);
    document.documentElement.dataset.siteContentReady="true";
  }).catch(function(){ var fallbackVideo=document.querySelector("#hero .gloobi-season-video"); if(fallbackVideo)loadHeroVideo(fallbackVideo.dataset.fallbackSrc); document.documentElement.dataset.siteContentReady="fallback"; });
})();
