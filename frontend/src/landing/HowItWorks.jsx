const imgIconPackage = "assets/landing/e04355c0-b3be-4c8b-b77e-3e9c966e15dc.svg";
const imgIcon = "assets/landing/66984a04-bd2f-493f-bfb6-d594ad7822dc.svg";
const imgPhotoProductImageFill = "assets/landing/c34e968d-5b7c-4505-b777-16daf1418bef.png";
const imgIcon1 = "assets/landing/4884e6b3-a71a-4b79-9b20-9c9602271f60.svg";
const imgIcon2 = "assets/landing/ca45e0ff-20e2-4523-9b6c-598d0728c45e.svg";
function RowStockChange({ className, change = "17 \u2192 15", name = "Shea butter 250g", showImage = false, type = "Normal" }) {
  const isCheckCount = type === "Check count";
  return <div className={className || "content-stretch flex gap-[var(--space-md,12px)] items-center py-[var(--space-sm,8px)] relative w-[328px]"} id={isCheckCount ? "node-255_2365" : "node-255_2353"}>
      {showImage && <div className="lp-2cfd5354b2" data-node-id="431:9066" data-name="Product image">
          <div className="lp-32a73237c3" data-node-id="I431:9066;421:636" data-name="Icon/Package">
            <img alt="" className="lp-e71beb8cb4" src={imgIconPackage} />
          </div>
        </div>}
      <div className="lp-7232dc486e" id={isCheckCount ? "node-255_2366" : "node-255_2354"} data-name="Text">
        <p className="lp-edb43cb457" data-node-id="255:2355">
          {name}
        </p>
        {isCheckCount && <div className="lp-ca2ad046bd" data-node-id="255:2368" data-name="Note row">
            <div className="lp-1b96182588" data-node-id="255:2369" data-name="Icon">
              <img alt="" className="lp-e71beb8cb4" src={imgIcon} />
            </div>
            <p className="lp-bbe6240190" data-node-id="255:2371">
              Check count — recount when you can
            </p>
          </div>}
      </div>
      <p className="lp-b22cff79af" data-node-id="255:2356">
        {change}
      </p>
    </div>;
}
export default function HowItWorks() {
  return <div className="lp-b7d19aa33c" data-node-id="694:105" data-name="How it works">
      <div className="lp-7201c415e8" data-node-id="694:106" data-name="Heading">
        <p className="lp-20d128d5e5" data-node-id="694:107">
          HOW IT WORKS
        </p>
        <h2 className="lp-ab55f52c32" data-node-id="694:108">
          From payment to recorded sale
        </h2>
      </div>
      <div className="lp-6c7ed6ff2c" data-node-id="694:109" data-name="Steps">
        <div className="lp-5e67c7ce4c" data-node-id="694:110" data-name="Step 1">
          <div className="lp-1d65a5a89d" data-node-id="694:111" data-name="Num">
            <p className="lp-22f9a95fa1" data-node-id="694:112">
              1
            </p>
          </div>
          <p className="lp-2a0aeb7ed6" data-node-id="694:113">
            A customer pays
          </p>
          <p className="lp-4816dabc77" data-node-id="694:114">
            Cash, transfer or card. Enter the amount, or see the payment come in when it’s collected through Invent IO.
          </p>
          <div className="lp-5d4fd10233" data-node-id="694:115" data-name="Demo">
            <div className="lp-dd4ac449dd" data-node-id="694:130" data-name="Card/Payment">
              <div className="lp-fde65e4dd4" data-node-id="I694:130;245:199" data-name="Top">
                <p className="lp-467fe204e2" data-node-id="I694:130;245:200">Amount received</p>
                <div className="lp-e22b6e7081" data-node-id="I694:130;245:201" data-annotations="Copy pending S8 (glossary): status “Waiting” vs PRD Pending/Matched" data-name="Status">
                  <div className="lp-1b96182588" data-node-id="I694:130;245:201;244:14" data-name="Icon">
                    <img alt="" className="lp-e71beb8cb4" src={imgIcon1} />
                  </div>
                  <p className="lp-241814fd7f" data-node-id="I694:130;245:201;244:16">
                    Pending
                  </p>
                </div>
              </div>
              <div className="lp-6bce829267" data-node-id="I694:130;245:205" data-name="Meta row">
                <p className="lp-24cb82bb5e" data-node-id="I694:130;245:206">Payment received</p>
                <p className="lp-2aced13796" data-node-id="I694:130;245:207">
                  Edit
                </p>
                <div className="lp-fa69d4c393" data-node-id="I694:130;255:234" data-name="Hit area · Edit" />
              </div>
            </div>
          </div>
        </div>
        <div className="lp-5e67c7ce4c" data-node-id="694:141" data-name="Step 2">
          <div className="lp-1d65a5a89d" data-node-id="694:142" data-name="Num">
            <p className="lp-22f9a95fa1" data-node-id="694:143">
              2
            </p>
          </div>
          <p className="lp-2a0aeb7ed6" data-node-id="694:144">
            Tap what they bought
          </p>
          <p className="lp-4816dabc77" data-node-id="694:145">
            Pick the products. The total is checked against the payment — a small difference, like a discount, is fine.
          </p>
          <div className="lp-5d4fd10233" data-node-id="694:146" data-name="Demo">
            <div className="lp-ade610c8fb" data-node-id="694:162" data-name="Bar/Selection">
              <div className="lp-2987773556" data-node-id="I694:162;246:492" data-name="Summary">
                <p className="lp-62abd5cba2" data-node-id="I694:162;246:493">Selected total</p>
                <p className="lp-7511b30874" data-node-id="I694:162;246:494">Selected products</p>
              </div>
              <div className="lp-d6da6c5986" data-node-id="I694:162;246:495" data-name="Message">
                <div className="lp-1b96182588" data-node-id="I694:162;246:496" data-name="Icon">
                  <img alt="" className="lp-e71beb8cb4" src={imgIcon2} />
                </div>
                <p className="lp-eb83716912" data-node-id="I694:162;246:498">
                  Matches the payment
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="lp-5e67c7ce4c" data-node-id="694:174" data-name="Step 3">
          <div className="lp-1d65a5a89d" data-node-id="694:175" data-name="Num">
            <p className="lp-22f9a95fa1" data-node-id="694:176">
              3
            </p>
          </div>
          <p className="lp-2a0aeb7ed6" data-node-id="694:177">
            Stock and profit update
          </p>
          <p className="lp-4816dabc77" data-node-id="694:178">
            Stock goes down by itself, low stock is flagged, and profit is worked out from your cost prices.
          </p>
          <div className="lp-abdd78c453" data-node-id="694:179" data-name="Demo">
            <div className="lp-5652d1d381" data-node-id="694:185" data-name="Row/Stock change">
              <div className="lp-2cfd5354b2" data-node-id="I694:185;431:9066" data-name="Product image">
                <div className="lp-53cf08c839" data-node-id="I694:185;431:9066;421:634" data-name="Photo (product image fill)">
                  <img alt="" className="lp-ad5b22f490" src={imgPhotoProductImageFill} />
                </div>
              </div>
              <div className="lp-7232dc486e" data-node-id="I694:185;255:2354" data-name="Text">
                <p className="lp-edb43cb457" data-node-id="I694:185;255:2355">Product</p>
              </div>
              <p className="lp-b22cff79af" data-node-id="I694:185;255:2356">Stock updates</p>
            </div>
            <RowStockChange change="1 → −1" className="lp-5652d1d381" name="Black soap" showImage type="Check count" />
          </div>
        </div>
      </div>
    </div>;
}
