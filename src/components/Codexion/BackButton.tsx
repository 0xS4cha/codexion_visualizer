import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function BackButton() {
  const navigate = useNavigate();
  return (
    <Button
      variant="ghost"
      onClick={() => navigate("/")}
      className="w-fit text-white/50 hover:text-white hover:bg-white/5 group"
    >
      <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
      Back to Visualizer
    </Button>
  );
}
