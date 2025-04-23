// src/components/Dashboard.jsx
import React from "react";
import { POWER_BI_EMBED_URL } from "../utils/constants";

const Dashboard = () => (
  <div>
    <h2>Risk Dashboard</h2>
    {/* <iframe
      title="Risk Dashboard"
      src={POWER_BI_EMBED_URL}
      width="100%"
      height="600px"
      frameBorder="0"
    /> */}
    <iframe title="StudentCopilot" 
    width="1140" 
    height="541.25" 
    src="https://app.powerbi.com/reportEmbed?reportId=274248fb-e2b5-4b32-9be9-b7b207c2bda6&autoAuth=true&ctid=a3f14f21-237f-4028-b978-425eb768a716" 
    frameborder="0" 
    allowFullScreen="true"></iframe>
  </div>
);

export default Dashboard;
