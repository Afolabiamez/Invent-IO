const imgGlyph = "assets/landing/7ba9a360-e266-41ac-8e64-85416c6e64e1.svg";
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
export default function Nav() {
  return <div className="lp-ea704973e2" data-node-id="694:4" data-name="Nav">
      <a href="#/welcome" aria-label="Invent IO home"><BrandLogo className="lp-070d2baa5e" /></a>
      <div className="lp-9ac75216cc" data-node-id="694:11" data-name="Spacer" />
      <a className="lp-ab89d549fc" data-node-id="694:12" href="#how-it-works" data-scroll="how-it-works">
        How it works
      </a>
      <a className="lp-ab89d549fc" data-node-id="694:13" href="#features" data-scroll="features">
        Features
      </a>
      <a className="lp-ab89d549fc" data-node-id="694:14" href="#owner-staff" data-scroll="owner-staff">{`Owner & Staff`}</a>
      <a className="lp-1ac97de37b" data-node-id="694:15" data-name="Button" href="#/login">
        <p className="lp-d7f38b6b1e" data-node-id="I694:15;243:68">
          Log in
        </p>
      </a>
      <a className="lp-e4d7898395" data-node-id="694:23" data-name="Button" href="#/create">
        <p className="lp-f43ea55a9c" data-node-id="I694:23;243:8">
          Create account
        </p>
      </a>
    </div>;
}
