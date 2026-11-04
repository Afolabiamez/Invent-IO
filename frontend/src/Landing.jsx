import React from 'react';
import Nav from './landing/Nav.jsx';
import Hero from './landing/Hero.jsx';
import HowItWorks from './landing/HowItWorks.jsx';
import FeatureGrid from './landing/FeatureGrid.jsx';
import StockFeature from './landing/StockFeature.jsx';
import SalesFeature from './landing/SalesFeature.jsx';
import OwnerStaff from './landing/OwnerStaff.jsx';
import Closing from './landing/Closing.jsx';
import Footer from './landing/Footer.jsx';
import './landing/generated.css';
import './landing/responsive.css';

export default function Landing() {
  return <div className="landing-design"><header><Nav/></header><main><section aria-label="Welcome"><Hero/></section><section id="how-it-works"><HowItWorks/></section><section id="features" className="lp-features"><StockFeature/><SalesFeature/><FeatureGrid/></section><section id="owner-staff"><OwnerStaff/></section><section aria-label="Get started"><Closing/></section></main><footer><Footer/></footer></div>;
}
