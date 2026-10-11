import HomePage from "./pages/HomePage";
import { Route, Routes } from "react-router";
import { useState } from "react";
import Navbar from "./pages/Navbar";
import { accounts } from "./constants/accounts";

const App = () => {
  const [account, setAccount] = useState(accounts[0]);

  return (
    <div>
      <Navbar account={account} onAccountChange={setAccount} />
      <Routes>
        <Route path="/" element={<HomePage user={account} />} />
      </Routes>
    </div>
  );
};

export default App;
