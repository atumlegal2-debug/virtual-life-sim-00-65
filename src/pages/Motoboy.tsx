import { MotoboyApp } from "@/components/apps/MotoboyApp";
import { useNavigate } from "react-router-dom";

const Motoboy = () => {
  const navigate = useNavigate();
  
  return <MotoboyApp onBack={() => navigate("/")} />;
};

export default Motoboy;