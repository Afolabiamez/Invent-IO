const imgGlyph = "assets/landing/dd037994-1c39-4cac-8457-87a42ad36a84.svg";
function BrandLogo({ className, size = "Small", tone = "Default" }) {
  return <div className={className || "content-stretch flex gap-[var(--space-sm,8px)] items-center relative"} data-node-id="457:471">
      <div className="lp-8ccbdd4e1d" data-node-id="457:472" data-name="Mark">
        <div className="lp-32a73237c3" data-node-id="457:473" data-name="Glyph">
          <img alt="" className="lp-e71beb8cb4" src={imgGlyph} />
        </div>
      </div>
      <p className="lp-7a87a326d8" data-node-id="457:475">
        Invent IO
      </p>
    </div>;
}
export default function Footer() {
  return <div className="lp-6e2da83bc4" data-node-id="694:407" data-name="Footer">
      <a href="#/welcome" aria-label="Invent IO home"><BrandLogo className="lp-070d2baa5e" /></a>
      <div className="lp-9ac75216cc" data-node-id="694:413" data-name="Spacer" />
      <p className="lp-9e41bb9dc2" data-node-id="694:414">
        Wallet withdrawals and WhatsApp summaries are in test mode. © 2026 Invent IO
      </p>
    </div>;
}
