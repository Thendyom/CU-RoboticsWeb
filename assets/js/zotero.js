// Minimal Zotero group fetch and render
async function loadZoteroPubs() {
  const GROUP_ID = window.ZOTERO_GROUP_ID || "6291575"; // e.g., 1234567
  const target = document.getElementById("pubs");
  if (!target) return;

  if (!GROUP_ID || GROUP_ID === "RoboticsWeb") {
    target.innerHTML = `<div class="pub-card">
      <p class="pub-title">Zotero not configured yet</p>
      <p class="pub-meta">Set <code>window.ZOTERO_GROUP_ID</code> before build, or edit <code>assets/js/zotero.js</code> and replace <code>REPLACE_ME</code> with your group ID.</p>
      <div class="badges"><span class="badge">Prototype</span><span class="badge">API</span></div>
    </div>`;
    return;
  }

  try {
    const url = `https://api.zotero.org/groups/${GROUP_ID}/items?format=json&limit=100`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("Zotero API error " + res.status);
    const items = await res.json();

    const cards = items
      .filter((it) => it && it.data && it.data.title)
      .map((it) => {
        const d = it.data;
        const title = d.title || "Untitled";
        const venue =
          d.publicationTitle ||
          d.proceedingsTitle ||
          d.conferenceName ||
          d.journalAbbreviation ||
          "";
        const date = (d.date || "").slice(0, 4);
        const authors = (d.creators || [])
          .map((c) => (c.lastName || "") + (c.firstName ? ", " + c.firstName[0] + "." : ""))
          .join("; ");
        const doi = d.DOI ? `https://doi.org/${d.DOI}` : null;
        const url = d.url || (d.extra && d.extra.includes("arXiv") ? d.extra : null);

        return `<div class="pub-card">
          <p class="pub-title">${title}</p>
          <p class="pub-meta">${authors}${venue ? " — " + venue : ""}${
          date ? " (" + date + ")" : ""
        }</p>
          <p class="pub-links">
            ${doi ? `<a href="${doi}" target="_blank" rel="noopener">DOI</a>` : ""}
            ${url ? `<a href="${url}" target="_blank" rel="noopener">Link</a>` : ""}
          </p>
        </div>`;
      })
      .join("\n");

    target.innerHTML = cards || "<p>No items yet.</p>";
  } catch (e) {
    target.innerHTML = `<p>Error loading Zotero items: ${e.message}</p>`;
  }
}
