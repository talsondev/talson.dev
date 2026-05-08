import { useMemo, useState } from "react";

const fieldConfig = {
  website: [
    { name: "title", placeholder: "Project Title *", type: "input" },
    { name: "slug", placeholder: "Slug (optional, e.g. talson_dev)", type: "input" },
    { name: "company", placeholder: "Company/Client", type: "input" },
    { name: "status", placeholder: "Status (Live, In-Dev)", type: "input" },
    { name: "liveUrl", placeholder: "Live URL", type: "input" },
    { name: "tagline", placeholder: "Short Tagline", type: "input" },
    { name: "problem", placeholder: "The Problem", type: "textarea" },
    { name: "solution", placeholder: "The Solution", type: "textarea" },
    { name: "stack", placeholder: "Stack (comma separated)", type: "input" },
    { name: "keyFeatures", placeholder: "Key Features (comma separated)", type: "input" },
    { name: "deployment", placeholder: "Deployment (e.g. Vercel)", type: "input" },
    { name: "logoImage", placeholder: "Logo image path (e.g. logo.webp)", type: "input" },
    { name: "heroBackgroundImage", placeholder: "Site preview image path (e.g. hero.webp)", type: "input" },
    { name: "heroBackgroundVideo", placeholder: "Site preview video path (e.g. hero.mp4)", type: "input" },
    { name: "gallery", placeholder: "Gallery image paths (comma separated)", type: "textarea" },
    { name: "colorPrimary", placeholder: "Primary color (e.g. #1f2937)", type: "input" },
    { name: "colorSecondary", placeholder: "Secondary color (e.g. #374151)", type: "input" },
    { name: "colorAccent", placeholder: "Accent color (e.g. #22d3ee)", type: "input" },
    { name: "category", placeholder: "Industry Category", type: "input" },
    { name: "completionDate", placeholder: "Completion Date", type: "input" },
    { name: "githubLink", placeholder: "GitHub Link", type: "input" },
  ],
  ux: [
    { name: "title", placeholder: "Project Title *", type: "input" },
    { name: "slug", placeholder: "Slug (optional, e.g. ux_case_01)", type: "input" },
    { name: "role", placeholder: "Your Role", type: "input" },
    { name: "duration", placeholder: "Duration", type: "input" },
    { name: "challenge", placeholder: "The Challenge", type: "textarea" },
    { name: "methods", placeholder: "Methods used (comma separated)", type: "input" },
    { name: "persona", placeholder: "Target Persona", type: "input" },
    { name: "keyInsight", placeholder: "Key Insight", type: "textarea" },
    { name: "userFlow", placeholder: "User Flow URL/Details", type: "input" },
    { name: "wireframes", placeholder: "Wireframes URL", type: "input" },
    { name: "prototypes", placeholder: "Prototype URL", type: "input" },
    { name: "accessibility", placeholder: "Accessibility Standards", type: "input" },
    { name: "usabilityResults", placeholder: "Usability Results", type: "textarea" },
    { name: "designChanges", placeholder: "Design Changes", type: "textarea" },
    { name: "styleGuide", placeholder: "Style Guide URL/Details", type: "input" },
    { name: "beforeAfter", placeholder: "Before & After URLs (comma separated)", type: "input" },
    { name: "metric", placeholder: "Key Success Metric", type: "input" },
    { name: "heroBackgroundImage", placeholder: "Hero background image path (optional)", type: "input" },
    { name: "heroBackgroundVideo", placeholder: "Hero background video path (optional)", type: "input" },
    { name: "logoImage", placeholder: "Logo image path (optional)", type: "input" },
    { name: "colorPrimary", placeholder: "Primary color (optional)", type: "input" },
    { name: "colorSecondary", placeholder: "Secondary color (optional)", type: "input" },
    { name: "colorAccent", placeholder: "Accent color (optional)", type: "input" },
  ],
  code: [
    { name: "title", placeholder: "Repo Name *", type: "input" },
    { name: "slug", placeholder: "Slug (optional, e.g. open_source_tool)", type: "input" },
    { name: "repoUrl", placeholder: "Repository URL", type: "input" },
    { name: "demoLink", placeholder: "Live Demo URL", type: "input" },
    { name: "primaryLanguage", placeholder: "Primary Language", type: "input" },
    { name: "libraries", placeholder: "Key Libraries (comma separated)", type: "input" },
    { name: "environment", placeholder: "Dev Environment/Tools", type: "input" },
    { name: "hardestPart", placeholder: "The Hardest Part", type: "textarea" },
    { name: "architecture", placeholder: "Architecture Pattern", type: "input" },
    { name: "perfSecurity", placeholder: "Performance/Security Notes", type: "textarea" },
    { name: "lessonsLearned", placeholder: "Lessons Learned", type: "textarea" },
    { name: "futureImprovements", placeholder: "Future Improvements", type: "textarea" },
    { name: "prerequisites", placeholder: "Prerequisites", type: "input" },
    { name: "installCommand", placeholder: "Quick Install Command", type: "input" },
    { name: "heroBackgroundImage", placeholder: "Hero background image path (optional)", type: "input" },
    { name: "heroBackgroundVideo", placeholder: "Hero background video path (optional)", type: "input" },
    { name: "logoImage", placeholder: "Logo image path (optional)", type: "input" },
    { name: "colorPrimary", placeholder: "Primary color (optional)", type: "input" },
    { name: "colorSecondary", placeholder: "Secondary color (optional)", type: "input" },
    { name: "colorAccent", placeholder: "Accent color (optional)", type: "input" },
  ],
};

const commaSeparatedFields = [
  "stack",
  "keyFeatures",
  "gallery",
  "methods",
  "beforeAfter",
  "libraries",
];

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "project";
}

function downloadJson(fileName, payload) {
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(payload, null, 2));

  const a = document.createElement("a");
  a.setAttribute("href", dataStr);
  a.setAttribute("download", fileName);
  a.click();
}

export default function ProjectForm() {
  const [projectType, setProjectType] = useState("website");
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({});

  const inferredSlug = useMemo(() => {
    if (!form.title) return "";
    return slugify(form.slug || form.title);
  }, [form.slug, form.title]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleTypeChange = (e) => {
    setProjectType(e.target.value);
    setForm({});
  };

  const handleAdd = () => {
    if (!form.title) return;

    const slug = slugify(form.slug || form.title);
    const newProject = { projectType, slug };

    fieldConfig[projectType].forEach((field) => {
      if (form[field.name]) {
        newProject[field.name] = form[field.name];
      }
    });

    commaSeparatedFields.forEach((field) => {
      if (newProject[field]) {
        newProject[field] = newProject[field]
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    });

    setProjects([...projects, newProject]);
    setForm({});
  };

  const exportSingle = (project) => {
    downloadJson(`${project.slug}.json`, project);
  };

  const exportIndex = () => {
    const uniqueFiles = [...new Set(projects.map((p) => `${p.slug}.json`))];
    downloadJson("projects.index.json", { projects: uniqueFiles });
  };

  return (
    <div style={{ maxWidth: "700px", margin: "2rem auto", padding: "1rem", fontFamily: "sans-serif" }}>
      <h2>Add Project</h2>

      <div style={{ display: "flex", gap: "15px", marginBottom: "1.5rem" }}>
        <label>
          <input type="radio" value="website" checked={projectType === "website"} onChange={handleTypeChange} />{" "}
          Standard Website
        </label>
        <label>
          <input type="radio" value="ux" checked={projectType === "ux"} onChange={handleTypeChange} /> UX Case Study
        </label>
        <label>
          <input type="radio" value="code" checked={projectType === "code"} onChange={handleTypeChange} /> Code/Git Repo
        </label>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {fieldConfig[projectType].map((field) => {
          if (field.type === "textarea") {
            return (
              <textarea
                key={field.name}
                name={field.name}
                placeholder={field.placeholder}
                value={form[field.name] || ""}
                onChange={handleChange}
                style={{ padding: "8px", minHeight: "80px" }}
              />
            );
          }

          return (
            <input
              key={field.name}
              name={field.name}
              placeholder={field.placeholder}
              value={form[field.name] || ""}
              onChange={handleChange}
              style={{ padding: "8px" }}
            />
          );
        })}
      </div>

      <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#555" }}>
        Output file: <strong>{inferredSlug || "project"}.json</strong>
      </p>

      <button
        onClick={handleAdd}
        style={{ marginTop: "1rem", padding: "10px 15px", cursor: "pointer", background: "#0070f3", color: "white", border: "none", borderRadius: "4px" }}
      >
        Add Project
      </button>

      <h3 style={{ marginTop: "2rem" }}>Preview List</h3>
      {projects.map((p, i) => (
        <div key={i} style={{ border: "1px solid #ddd", padding: "15px", margin: "10px 0", borderRadius: "5px", position: "relative" }}>
          <span style={{ position: "absolute", top: "10px", right: "10px", fontSize: "0.75rem", color: "#888", textTransform: "uppercase" }}>
            {p.projectType}
          </span>

          <h4 style={{ margin: "0 0 8px 0" }}>{p.title}</h4>
          <p style={{ margin: "0 0 8px 0", color: "#666" }}>slug: {p.slug}</p>

          {p.projectType === "website" && (
            <div style={{ fontSize: "0.9rem" }}>
              {p.company && <p><strong>Client:</strong> {p.company}</p>}
              {p.tagline && <p><em>"{p.tagline}"</em></p>}
              {p.stack && <p><strong>Stack:</strong> {p.stack.join(", ")}</p>}
              {p.heroBackgroundVideo && <p><strong>Hero video:</strong> {p.heroBackgroundVideo}</p>}
              {(p.colorPrimary || p.colorSecondary || p.colorAccent) && (
                <p>
                  <strong>Colors:</strong>{" "}
                  {[p.colorPrimary, p.colorSecondary, p.colorAccent].filter(Boolean).join(", ")}
                </p>
              )}
              {p.liveUrl && <a href={p.liveUrl} target="_blank" rel="noreferrer">Live URL</a>}
              {p.githubLink && (
                <>
                  {" | "}
                  <a href={p.githubLink} target="_blank" rel="noreferrer">GitHub</a>
                </>
              )}
            </div>
          )}

          {p.projectType === "ux" && (
            <div style={{ fontSize: "0.9rem" }}>
              {p.role && <p><strong>Role:</strong> {p.role}</p>}
              {p.challenge && <p><strong>Challenge:</strong> {p.challenge}</p>}
              {p.metric && <p><strong>Success Metric:</strong> {p.metric}</p>}
              {p.prototypes && <a href={p.prototypes} target="_blank" rel="noreferrer">Interactive Prototype</a>}
            </div>
          )}

          {p.projectType === "code" && (
            <div style={{ fontSize: "0.9rem" }}>
              {p.primaryLanguage && <p><strong>Language:</strong> {p.primaryLanguage}</p>}
              {p.hardestPart && <p><strong>Hurdle:</strong> {p.hardestPart}</p>}
              {p.repoUrl && <a href={p.repoUrl} target="_blank" rel="noreferrer">View Repository</a>}
            </div>
          )}

          <button
            onClick={() => exportSingle(p)}
            style={{ marginTop: "0.5rem", padding: "8px 12px", cursor: "pointer", background: "#222", color: "white", border: "none", borderRadius: "4px" }}
          >
            Export {p.slug}.json
          </button>
        </div>
      ))}

      {projects.length > 0 && (
        <button
          onClick={exportIndex}
          style={{ marginTop: "1rem", padding: "10px 15px", cursor: "pointer", background: "#444", color: "white", border: "none", borderRadius: "4px" }}
        >
          Export projects.index.json
        </button>
      )}
    </div>
  );
}
