import "./config/env.js";

import dns from "dns";
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import app from "./app.js";
import connectDB from "./config/db.js";


const PORT = process.env.PORT || 3000;


connectDB().then(() => {

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });

});