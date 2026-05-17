import { useNavigate } from "react-router-dom";

export default function Unauthorized() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#0B2545] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="flex items-baseline gap-0.5 justify-center mb-8">
          <span className="text-3xl font-bold text-white">Vegl</span>
          <span className="text-3xl font-bold text-[#C9A96E]">.</span>
          <span className="text-3xl font-bold text-[#5DD3A8]">ia</span>
        </div>
        <p className="text-white/50 text-sm mb-4">
          Voce nao tem permissao para acessar esta area.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="text-[#5DD3A8] text-sm hover:underline"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}
