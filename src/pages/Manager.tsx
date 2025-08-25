import { ManagerApp } from "@/components/apps/ManagerApp";
import { useNavigate } from "react-router-dom";

const Manager = () => {
  const navigate = useNavigate();
  
  return <ManagerApp onBack={() => navigate("/")} />;
};

export default Manager;