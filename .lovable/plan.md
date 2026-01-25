
## Update SiteIntel Logo Across the Site

### Overview
Replace the current logo (`siteintel-ai-logo-main.png`) with the new isometric building design logo across all 13 files that reference it.

### New Logo Characteristics
- **Design:** Isometric building icon (orange) on a grid platform, encircled by a blue arc
- **Text:** "SITEINTEL™" wordmark in light gray
- **Format:** Horizontal layout, suitable for headers and footers

---

### Step 1: Copy New Logo Asset

Copy the uploaded logo to the src/assets folder, replacing the current main logo:

```text
src/assets/siteintel-ai-logo-main.png ← New logo replaces existing
```

This single asset replacement will automatically propagate to all 13 files that import it.

---

### Step 2: Files Automatically Updated (No Code Changes Needed)

Since all components import from `@/assets/siteintel-ai-logo-main.png`, replacing the file updates:

| Component/Page | Location |
|---------------|----------|
| Header | `src/components/navigation/Header.tsx` |
| Footer (nav) | `src/components/navigation/Footer.tsx` |
| Auth Page | `src/pages/Auth.tsx` |
| Investor Deck | `src/pages/InvestorDeck.tsx` |
| Report Viewer | `src/pages/ReportViewer.tsx` |
| Report Layout | `src/pages/report/ReportLayout.tsx` |
| Report Header | `src/components/report/ReportHeader.tsx` |
| Docs Layout | `src/components/docs/DocsLayout.tsx` |
| Developers Industry | `src/pages/industries/Developers.tsx` |
| Lenders Industry | `src/pages/industries/Lenders.tsx` |
| Beta Sticky Header | `src/components/sections/prelaunch/BetaStickyHeader.tsx` |
| Prelaunch Footer | `src/components/sections/prelaunch/PrelaunchFooter.tsx` |
| Brand Kit | `src/pages/BrandKit.tsx` |

---

### Step 3: Update Public Logo for SEO

Copy the logo to the public folder for SEO/structured data references:

```text
public/logo.png ← New logo for JSON-LD schema
```

This updates the logo referenced in `src/lib/seo-config.ts`:
```typescript
logo: "https://siteintel.lovable.app/logo.png"
```

---

### Step 4: Update Brand Kit Gallery (Optional Enhancement)

The Brand Kit page at `/brand-kit` displays logo assets. The new logo will automatically appear since it imports `siteintel-ai-logo-main.png`.

---

### Technical Notes

- **No code changes required:** All 13 files use the same import path, so replacing the asset file automatically updates the entire site
- **Sizing preserved:** Existing Tailwind classes (h-8, h-10, h-12, h-16) will scale the new logo appropriately
- **Dark/light compatibility:** The new logo uses blue and orange on a transparent/white background, which works well on both dark and light surfaces

---

### Verification Checklist

After the update, verify logo appearance on:
- [ ] Main site header and footer
- [ ] Authentication page
- [ ] Report viewer header
- [ ] Documentation pages
- [ ] Industry pages (Developers, Lenders)
- [ ] Investor deck
- [ ] Beta/prelaunch pages
