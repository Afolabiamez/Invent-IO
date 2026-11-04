const imgIconWarning = "assets/landing/733834d1-b6c1-43b4-90fd-07e535c774ff.svg";
const imgIconCheckCircle = "assets/landing/7c0c0de7-062b-4883-9f46-2fe16493de0a.svg";
const imgIconChartBar = "assets/landing/75dbe173-8504-401a-9c46-09043d1ffe5a.svg";
const imgIconUsers = "assets/landing/9cc1d30e-d922-4ed1-86d4-d7d21ee60c03.svg";
const imgIconReceipt = "assets/landing/f842e179-2010-4bf7-9538-95954d5d4ea2.svg";
const imgIconBank = "assets/landing/bc28e52f-7e0e-4f1e-86a3-b82419f4f066.svg";
export default function FeatureGrid() {
  return <div className="lp-9708a22fbd" data-node-id="694:348" data-name="Feature grid">
      <div className="lp-9709a8f5f0" data-node-id="694:349" data-name="Low-stock alerts">
        <div className="lp-d64ab2bc93" data-node-id="694:350" data-name="Icon/Warning">
          <img alt="" className="lp-e71beb8cb4" src={imgIconWarning} />
        </div>
        <p className="lp-2a0aeb7ed6" data-node-id="694:352">
          Low-stock alerts
        </p>
        <p className="lp-4816dabc77" data-node-id="694:353">
          Set an alert number per product. Anything at or below it shows as Low.
        </p>
      </div>
      <div className="lp-9709a8f5f0" data-node-id="694:354" data-name="Selling is never blocked">
        <div className="lp-d64ab2bc93" data-node-id="694:355" data-name="Icon/CheckCircle">
          <img alt="" className="lp-e71beb8cb4" src={imgIconCheckCircle} />
        </div>
        <p className="lp-2a0aeb7ed6" data-node-id="694:357">
          Selling is never blocked
        </p>
        <p className="lp-4816dabc77" data-node-id="694:358">
          Sell more than the app shows and the product is marked “Check count” so you can recount.
        </p>
      </div>
      <div className="lp-9709a8f5f0" data-node-id="694:359" data-name="Profit on every sale">
        <div className="lp-d64ab2bc93" data-node-id="694:360" data-name="Icon/ChartBar">
          <img alt="" className="lp-e71beb8cb4" src={imgIconChartBar} />
        </div>
        <p className="lp-2a0aeb7ed6" data-node-id="694:362">
          Profit on every sale
        </p>
        <p className="lp-4816dabc77" data-node-id="694:363">
          Selling price minus cost price. If a cost price is missing, profit shows “Not available” — never a guess.
        </p>
      </div>
      <div className="lp-9709a8f5f0" data-node-id="694:364" data-name="Owner and Staff">
        <div className="lp-d64ab2bc93" data-node-id="694:365" data-name="Icon/Users">
          <img alt="" className="lp-e71beb8cb4" src={imgIconUsers} />
        </div>
        <p className="lp-2a0aeb7ed6" data-node-id="694:367">
          Owner and Staff
        </p>
        <p className="lp-4816dabc77" data-node-id="694:368">
          Invite staff with a link. They see only what you allow — never your cost prices or profit.
        </p>
      </div>
      <div className="lp-9709a8f5f0" data-node-id="694:369" data-name="Weekly summary">
        <div className="lp-d64ab2bc93" data-node-id="694:370" data-name="Icon/Receipt">
          <img alt="" className="lp-e71beb8cb4" src={imgIconReceipt} />
        </div>
        <p className="lp-2a0aeb7ed6" data-node-id="694:372">
          Weekly summary
        </p>
        <p className="lp-4816dabc77" data-node-id="694:373">
          Last week’s sales, top products and low stock, sent to your email. WhatsApp delivery is in testing.
        </p>
      </div>
      <div className="lp-9709a8f5f0" data-node-id="694:374" data-name="Wallet">
        <div className="lp-d64ab2bc93" data-node-id="694:375" data-name="Icon/Bank">
          <img alt="" className="lp-e71beb8cb4" src={imgIconBank} />
        </div>
        <p className="lp-2a0aeb7ed6" data-node-id="694:377">
          Wallet
        </p>
        <p className="lp-4816dabc77" data-node-id="694:378">
          For businesses that collect payments through Invent IO. Withdrawals currently run in test mode — no real money moves yet.
        </p>
      </div>
    </div>;
}
