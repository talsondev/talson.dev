function escapeHtml(s) {
    if (s == null) return "";
    return String(s)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function slugify(value) {
    return String(value || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") || "project";
}

function safeCssColor(value) {
    let s = String(value || "").trim();
    if (s.endsWith(";")) s = s.slice(0, -1).trim();
    if (!s) return "";
    if (/^(#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\)|hsl[a]?\([^)]+\)|oklch\([^)]+\)|oklab\([^)]+\))$/.test(s)) {
        return s;
    }
    return "";
}

function parseColorToRgb(color) {
    const s = String(color || "").trim();
    if (!s) return null;

    const hex = s.match(/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/);
    if (hex) {
        const token = hex[1];
        if (token.length === 3 || token.length === 4) {
            const r = parseInt(token[0] + token[0], 16);
            const g = parseInt(token[1] + token[1], 16);
            const b = parseInt(token[2] + token[2], 16);
            return { r, g, b };
        }
        const r = parseInt(token.slice(0, 2), 16);
        const g = parseInt(token.slice(2, 4), 16);
        const b = parseInt(token.slice(4, 6), 16);
        return { r, g, b };
    }

    const rgb = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
    if (rgb) {
        return {
            r: Math.max(0, Math.min(255, Number(rgb[1]))),
            g: Math.max(0, Math.min(255, Number(rgb[2]))),
            b: Math.max(0, Math.min(255, Number(rgb[3]))),
        };
    }

    return null;
}

function perceivedLuminance({ r, g, b }) {
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function resolveTextPalette(primary) {
    const rgb = parseColorToRgb(primary);
    if (!rgb) {
        return { text: "#fffcf5", muted: "rgba(255, 252, 245, 0.68)" };
    }

    const isLight = perceivedLuminance(rgb) > 0.62;
    if (isLight) {
        return { text: "#161616", muted: "rgba(22, 22, 22, 0.64)" };
    }

    return { text: "#fffcf5", muted: "rgba(255, 252, 245, 0.68)" };
}

function resolveCardColors(raw) {
    const palette = raw && typeof raw.colors === "object" && !Array.isArray(raw.colors) ? raw.colors : {};
    const arrayPalette = Array.isArray(raw?.colors) ? raw.colors : [];

    const primary = safeCssColor(
        raw.colorPrimary || raw.primaryColor || palette.primary || arrayPalette[0]
    );
    const secondary = safeCssColor(
        raw.colorSecondary || raw.secondaryColor || palette.secondary || arrayPalette[1]
    );
    const accent = safeCssColor(
        raw.colorAccent || raw.accentColor || palette.accent || arrayPalette[2]
    );

    const textIdle = resolveTextPalette(primary || secondary || "");
    const hoverSurface = secondary || primary || "";
    const textHover = resolveTextPalette(hoverSurface);

    const modalBg = secondary || primary || "rgba(255, 252, 245, 0.96)";
    const toolbarBg = secondary || modalBg;
    return {
        primary,
        secondary,
        accent,
        modalBg,
        toolbarBg,
        text: textIdle.text,
        muted: textIdle.muted,
        textHover: textHover.text,
        mutedHover: textHover.muted,
    };
}

function normalizePathWithSlug(input, slug) {
    if (!input) return "";
    const s = String(input).trim();
    if (!s) return "";
    if (/^(https?:)?\/\//i.test(s)) return s;
    if (s.startsWith("/")) return s;
    if (s.startsWith("./") || s.startsWith("../")) return s;
    if (!slug) return s;
    return `./assets/projects/${slug}/${s}`;
}

function isVideoAsset(path) {
    const s = String(path || "").toLowerCase().split("?")[0].split("#")[0];
    return [".mp4", ".webm", ".mov", ".m4v", ".ogv"].some((ext) => s.endsWith(ext));
}

function stackLine(project) {
    const s = project.stack;
    if (!s) return "";
    if (Array.isArray(s)) return s.join(", ");
    return String(s);
}

function cardSubtitle(project) {
    if (project.projectType === "website") return project.tagline || project.description || "";
    if (project.projectType === "ux") return project.role || project.challenge || "";
    if (project.projectType === "code") return project.primaryLanguage || project.hardestPart || "";
    return project.description || project.tagline || "";
}

function primaryLink(project) {
    if (project.projectType === "website") return project.liveUrl || project.githubLink;
    if (project.projectType === "ux") return project.prototypes || project.wireframes;
    if (project.projectType === "code") return project.demoLink || project.repoUrl;
    return project.link || project.liveUrl;
}

function linkLabel(project) {
    if (project.projectType === "website") {
        if (project.liveUrl) return "Live site";
        if (project.githubLink) return "GitHub";
    }
    if (project.projectType === "ux") {
        if (project.prototypes) return "Prototype";
        if (project.wireframes) return "Wireframes";
    }
    if (project.projectType === "code") {
        if (project.demoLink) return "Demo";
        if (project.repoUrl) return "Repository";
    }
    if (project.link) return "Link";
    return "Open";
}

function section(label, body) {
    if (!body) return "";
    const sectionClass = label.toLowerCase() === "links" ? "peek-section peek-section-links" : "peek-section";
    return `<section class="${sectionClass}"><h3 class="peek-section-title">${escapeHtml(label)}</h3><div class="peek-section-body">${body}</div></section>`;
}

function paragraphs(text) {
    if (!text) return "";
    return `<p>${escapeHtml(text).replaceAll("\n\n", "</p><p>").replaceAll("\n", "<br>")}</p>`;
}

function listRow(label, value) {
    if (!value) return "";
    const display = Array.isArray(value) ? value.join(", ") : String(value);
    return `<div class="peek-kv"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(display)}</dd></div>`;
}

function asUrlArray(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    return String(val)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
}

function galleryBlock(urls) {
    const list = asUrlArray(urls);
    if (!list.length) return "";
    const imgs = list
        .map((u) => `<li><img src="${escapeHtml(u)}" alt="" loading="lazy" decoding="async" /></li>`)
        .join("");
    return `<ul class="peek-gallery">${imgs}</ul>`;
}

function detailBodyWebsite(p) {
    const overviewText = [p.tagline, p.problem, p.solution].filter(Boolean).join("\n\n");
    const hero = p.heroImage
        ? section("Hero", `<img src="${escapeHtml(p.heroImage)}" alt="" loading="lazy" decoding="async" />`)
        : "";

    return [
        overviewText ? section("Overview", paragraphs(overviewText)) : "",
        hero,
        section(
            "Details",
            `<dl class="peek-dl">${[
                listRow("Client", p.company),
                listRow("Status", p.status),
                listRow("Stack", p.stack),
                listRow("Key features", p.keyFeatures),
                listRow("Deployment", p.deployment),
                listRow("Category", p.category),
                listRow("Completed", p.completionDate),
            ].join("")}</dl>`
        ),
        section("Gallery", galleryBlock(p.gallery)),
        section(
            "Links",
            `<ul class="peek-links">${[
                p.liveUrl && `<li><a href="${escapeHtml(p.liveUrl)}" target="_blank" rel="noopener noreferrer">Live site</a></li>`,
                p.githubLink && `<li><a href="${escapeHtml(p.githubLink)}" target="_blank" rel="noopener noreferrer">GitHub</a></li>`,
            ]
                .filter(Boolean)
                .join("")}</ul>`
        ),
    ].join("");
}

function detailBodyUx(p) {
    return [
        section("Challenge", paragraphs(p.challenge)),
        section("Process", paragraphs([p.methods, p.persona, p.keyInsight].filter(Boolean).join("\n\n"))),
        section(
            "Details",
            `<dl class="peek-dl">${[
                listRow("Role", p.role),
                listRow("Duration", p.duration),
                listRow("Accessibility", p.accessibility),
                listRow("Metric", p.metric),
            ].join("")}</dl>`
        ),
        section("Research & outcomes", paragraphs([p.usabilityResults, p.designChanges].filter(Boolean).join("\n\n"))),
        section(
            "Links",
            `<ul class="peek-links">${[
                p.userFlow && `<li><a href="${escapeHtml(p.userFlow)}" target="_blank" rel="noopener noreferrer">User flow</a></li>`,
                p.wireframes && `<li><a href="${escapeHtml(p.wireframes)}" target="_blank" rel="noopener noreferrer">Wireframes</a></li>`,
                p.prototypes && `<li><a href="${escapeHtml(p.prototypes)}" target="_blank" rel="noopener noreferrer">Prototype</a></li>`,
                p.styleGuide && `<li><a href="${escapeHtml(p.styleGuide)}" target="_blank" rel="noopener noreferrer">Style guide</a></li>`,
            ]
                .filter(Boolean)
                .join("")}</ul>`
        ),
    ].join("");
}

function detailBodyCode(p) {
    return [
        section("Summary", paragraphs([p.hardestPart, p.architecture].filter(Boolean).join("\n\n"))),
        section(
            "Technical",
            `<dl class="peek-dl">${[
                listRow("Language", p.primaryLanguage),
                listRow("Libraries", p.libraries),
                listRow("Environment", p.environment),
                listRow("Prerequisites", p.prerequisites),
                listRow("Install", p.installCommand),
            ].join("")}</dl>`
        ),
        section("Performance & security", paragraphs(p.perfSecurity)),
        section("Lessons learned", paragraphs(p.lessonsLearned)),
        section("Future work", paragraphs(p.futureImprovements)),
        section(
            "Links",
            `<ul class="peek-links">${[
                p.repoUrl && `<li><a href="${escapeHtml(p.repoUrl)}" target="_blank" rel="noopener noreferrer">Repository</a></li>`,
                p.demoLink && `<li><a href="${escapeHtml(p.demoLink)}" target="_blank" rel="noopener noreferrer">Live demo</a></li>`,
            ]
                .filter(Boolean)
                .join("")}</ul>`
        ),
    ].join("");
}

function detailBodyLegacy(p) {
    return [
        section("About", paragraphs(p.description)),
        section(
            "Details",
            `<dl class="peek-dl">${[
                listRow("Company", p.company),
                listRow("Stack", p.stack),
            ].join("")}</dl>`
        ),
        p.link
            ? section(
                  "Links",
                  `<ul class="peek-links"><li><a href="${escapeHtml(p.link)}" target="_blank" rel="noopener noreferrer">Project link</a></li></ul>`
              )
            : "",
    ].join("");
}

function detailBody(project) {
    const t = project.projectType || "legacy";
    if (t === "website") return detailBodyWebsite(project);
    if (t === "ux") return detailBodyUx(project);
    if (t === "code") return detailBodyCode(project);
    return detailBodyLegacy(project);
}

function modalHtml(project, modalId, dialogDomId) {
    const title = escapeHtml(project.title);
    const sub = cardSubtitle(project);
    const stack = stackLine(project);
    const topNavUrl = primaryLink(project);
    const topNavLabel = linkLabel(project);
    const hasHeroVisual = project.heroBackgroundImage || project.heroBackgroundVideo || project.logoImage;
    const shellClass = topNavUrl ? "peek-shell has-top-trigger" : "peek-shell";

    const scrollClass = hasHeroVisual ? "peek-scroll peek-scroll--hero-bg" : "peek-scroll";

    const heroBackgroundStyle =
        project.heroBackgroundImage && !isVideoAsset(project.heroBackgroundImage)
            ? `--project-hero-image:url('${escapeHtml(project.heroBackgroundImage)}');`
            : "";

    return `
<dialog id="${escapeHtml(dialogDomId)}" class="peek-panel poppins-regular" data-modal="${escapeHtml(modalId)}" aria-label="${title}">
  <div class="${shellClass}" data-vt-card style="--project-modal-bg:${escapeHtml(project.cardColors.modalBg || "")};--project-modal-toolbar:${escapeHtml(project.cardColors.toolbarBg || "")};--project-modal-text:${escapeHtml(project.cardColors.text || "")};--project-modal-muted:${escapeHtml(project.cardColors.muted || "")};--project-modal-accent:${escapeHtml(project.cardColors.accent || "")};">
    ${hasHeroVisual
        ? `<div class="peek-modal-hero" data-vt-image style="${heroBackgroundStyle}">
            ${
                project.heroBackgroundVideo
                    ? `<video class="peek-modal-video" src="${escapeHtml(project.heroBackgroundVideo)}" muted playsinline autoplay loop preload="metadata" ${project.heroBackgroundImage ? `poster="${escapeHtml(project.heroBackgroundImage)}"` : ""}></video>`
                    : ""
            }
            ${project.logoImage ? `<img class="peek-modal-logo" src="${escapeHtml(project.logoImage)}" alt="${escapeHtml(project.title)} logo" loading="lazy" decoding="async" />` : ""}
            ${topNavUrl ? `<a class="peek-modal-hover-link" href="${escapeHtml(topNavUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(topNavLabel)}"></a>` : ""}
          </div>`
        : ""}
    <div class="${scrollClass}">
      <div class="peek-modal-content">
        ${sub ? `<p class="peek-modal-sub" data-vt-subtitle>${escapeHtml(sub)}</p>` : ""}
        ${stack ? `<p class="peek-modal-meta" data-vt-meta>${escapeHtml(stack)}</p>` : ""}
        <div class="peek-body">${detailBody(project)}</div>
      </div>
    </div>
  </div>
</dialog>`;
}

function triggerHtml(project, modalId, dialogDomId) {
    const sub = cardSubtitle(project);
    const stack = stackLine(project);
    const url = primaryLink(project);
    const linkText = linkLabel(project);

    const meta = stack ? `<p class="peek-card-meta"><span class="peek-card-stack">${escapeHtml(stack)}</span></p>` : "";
    const slugLine = project.slug ? `<span class="peek-card-type">${escapeHtml(project.slug)}</span>` : "";
    const link = url
        ? `<span class="peek-card-footer" data-no-modal><span class="peek-card-link">${escapeHtml(linkText)} →</span></span>`
        : "";
    const primaryAttr = url ? ` data-primary-url="${escapeHtml(url)}"` : "";
    const styleAttr = ` style="--project-card-primary:${escapeHtml(project.cardColors.primary || "")};--project-card-secondary:${escapeHtml(project.cardColors.secondary || "")};--project-card-accent:${escapeHtml(project.cardColors.accent || "")};--project-card-text:${escapeHtml(project.cardColors.text || "")};--project-card-muted:${escapeHtml(project.cardColors.muted || "")};--project-card-text-hover:${escapeHtml(project.cardColors.textHover || "")};--project-card-muted-hover:${escapeHtml(project.cardColors.mutedHover || "")};"`;
    const media = (project.heroBackgroundImage || project.logoImage)
        ? `<div class="peek-card-media" data-vt-image style="${project.heroBackgroundImage ? `--project-hero-image:url('${escapeHtml(project.heroBackgroundImage)}');` : ""}">
            ${project.logoImage ? `<img class="peek-card-logo" src="${escapeHtml(project.logoImage)}" alt="${escapeHtml(project.title)} logo" loading="lazy" decoding="async" />` : ""}
          </div>`
        : "";

    return `
<button type="button" class="peek-card-trigger" data-vt-card${primaryAttr}${styleAttr} data-open-modal="${escapeHtml(modalId)}" aria-haspopup="dialog" aria-controls="${escapeHtml(dialogDomId)}">
  ${media}
  <span class="peek-card-type" data-vt-type>${escapeHtml(project.projectType || "project")}</span>
  ${slugLine}
  <span class="peek-card-title">${escapeHtml(project.title)}</span>
  ${sub ? `<span class="peek-card-sub" data-vt-subtitle>${escapeHtml(sub)}</span>` : ""}
  ${meta ? meta.replace('peek-card-stack">', 'peek-card-stack" data-vt-meta>') : ""}
  ${link ? link.replace('peek-card-link">', 'peek-card-link" data-vt-footer>') : ""}
</button>`;
}

function normalizeProject(raw) {
    if (!raw || typeof raw !== "object") return null;
    const slug = raw.slug ? slugify(raw.slug) : slugify(raw.title);
    const normalized = { ...raw, slug, cardColors: resolveCardColors(raw) };

    const logo = normalized.logoImage || normalized.heroImage;
    if (logo) {
        normalized.logoImage = normalizePathWithSlug(logo, slug);
    }

    if (normalized.heroBackgroundImage) {
        normalized.heroBackgroundImage = normalizePathWithSlug(normalized.heroBackgroundImage, slug);
    }
    if (!normalized.heroBackgroundVideo && isVideoAsset(normalized.heroBackgroundImage)) {
        normalized.heroBackgroundVideo = normalized.heroBackgroundImage;
        normalized.heroBackgroundImage = "";
    }
    if (normalized.heroBackgroundVideo) {
        normalized.heroBackgroundVideo = normalizePathWithSlug(normalized.heroBackgroundVideo, slug);
    }

    if (normalized.gallery) {
        normalized.gallery = asUrlArray(normalized.gallery).map((item) => normalizePathWithSlug(item, slug));
    }

    return normalized;
}

async function readJsonFile(fileName) {
    const response = await fetch(`./data/${fileName}`);
    if (!response.ok) {
        throw new Error(`Failed loading ${fileName}: ${response.status}`);
    }
    return response.json();
}

async function fetchProjectSources() {
    const indexResponse = await fetch("./data/projects.index.json");
    if (indexResponse.ok) {
        const indexJson = await indexResponse.json();
        const files = Array.isArray(indexJson) ? indexJson : indexJson.projects;
        if (!Array.isArray(files) || !files.length) return [];

        const results = await Promise.all(
            files.map(async (fileName) => {
                const json = await readJsonFile(fileName);
                return Array.isArray(json) ? json : [json];
            })
        );

        return results.flat();
    }

    // Backward compatibility fallback for the previous single-file setup.
    const legacyResponse = await fetch("./data/projects.json");
    if (!legacyResponse.ok) {
        throw new Error(`No project index found (status ${indexResponse.status})`);
    }

    const legacy = await legacyResponse.json();
    return Array.isArray(legacy) ? legacy : [legacy];
}

async function loadProjects() {
    const mount = document.querySelector("#projects-mount");
    if (!mount) return;

    try {
        const rawProjects = await fetchProjectSources();
        const data = rawProjects.map(normalizeProject).filter(Boolean);

        const blocks = data.map((project, i) => {
            const modalId = `project-${i}`;
            const dialogDomId = `project-dialog-${i}`;
            return triggerHtml(project, modalId, dialogDomId) + modalHtml(project, modalId, dialogDomId);
        });

        mount.innerHTML = blocks.join("");
    } catch (err) {
        console.error("Failed to load projects:", err);
        mount.innerHTML = `<p class="peek-error">Projects could not be loaded.</p>`;
    }
}

loadProjects();
