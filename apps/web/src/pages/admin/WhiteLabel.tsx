import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@veglia/firebase-config";
import type { Company, WhiteLabelConfig } from "@veglia/shared";

// ─── Preview inline ───────────────────────────────────────────────────────────

interface PreviewProps {
  config: WhiteLabelConfig;
}

function Preview({ config }: PreviewProps) {
  return (
    <div
      className="rounded-2xl border border-white/10 overflow-hidden"
      style={{ "--preview-primary": config.primary_color, "--preview-secondary": config.secondary_color } as React.CSSProperties}
    >
      {/* Simula barra lateral */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ background: "#0B2545" }}
      >
        {config.logo_url ? (
          <img
            src={config.logo_url}
            alt="Logo"
            className="h-8 w-auto object-contain rounded"
          />
        ) : (
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ background: config.primary_color }}
          >
            {config.platform_name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-sm font-bold text-white">{config.platform_name}</p>
          <p className="text-[10px] text-white/30">Painel RH</p>
        </div>
      </div>
      <div className="h-0.5" style={{ background: config.primary_color }} />
      <div className="p-5 bg-[#0B2545]/50 space-y-2">
        {["Dashboard", "Trilhas", "Certificados"].map((item) => (
          <div
            key={item}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/50"
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: config.secondary_color }}
            />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function WhiteLabel() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [config, setConfig] = useState<WhiteLabelConfig>({
    primary_color: "#5DD3A8",
    secondary_color: "#C9A96E",
    platform_name: "Vegl.ia",
    logo_url: "",
    custom_domain: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "companies"), (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Company));
      setCompanies(docs);
      if (docs.length > 0 && !selectedId) {
        setSelectedId(docs[0].id);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // Carrega config da empresa selecionada
  useEffect(() => {
    if (!selectedId) return;
    const company = companies.find((c) => c.id === selectedId);
    if (company?.theme) {
      setConfig({
        primary_color: company.theme.primary ?? "#5DD3A8",
        secondary_color: company.theme.secondary ?? "#C9A96E",
        platform_name: company.theme.platform_name ?? company.name,
        logo_url: company.theme.logo_url ?? "",
        custom_domain: company.theme.custom_domain ?? "",
      });
    } else if (company) {
      setConfig({
        primary_color: "#5DD3A8",
        secondary_color: "#C9A96E",
        platform_name: company.name,
        logo_url: "",
        custom_domain: "",
      });
    }
  }, [selectedId, companies]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedId) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `logos/${selectedId}/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setConfig((prev) => ({ ...prev, logo_url: url }));
    } catch (err) {
      console.error("Erro ao fazer upload:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, "companies", selectedId),
        {
          theme: {
            primary: config.primary_color,
            secondary: config.secondary_color,
            platform_name: config.platform_name,
            logo_url: config.logo_url,
            custom_domain: config.custom_domain,
          },
        },
        { merge: true }
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">White Label</h1>
        <p className="text-sm text-white/40 mt-0.5">
          Configure a identidade visual por empresa cliente
        </p>
      </div>

      {/* Selector de empresa */}
      <div>
        <label className="block text-xs font-medium text-white/50 mb-2">Empresa</label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5DD3A8]/50 w-72"
        >
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Configuracoes</h2>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">Nome da plataforma</label>
            <input
              type="text"
              value={config.platform_name}
              onChange={(e) => setConfig((p) => ({ ...p, platform_name: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5DD3A8]/50"
              placeholder="Ex: Academia RH Empresa"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">Logo</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl px-3 py-2 text-xs text-white/60 cursor-pointer transition-colors">
                <span>◈</span>
                {uploading ? "Enviando..." : "Fazer upload"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
              {config.logo_url && (
                <img
                  src={config.logo_url}
                  alt="Logo atual"
                  className="h-8 w-auto object-contain rounded opacity-60"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1">Cor primaria</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.primary_color}
                  onChange={(e) => setConfig((p) => ({ ...p, primary_color: e.target.value }))}
                  className="w-10 h-8 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={config.primary_color}
                  onChange={(e) => setConfig((p) => ({ ...p, primary_color: e.target.value }))}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none"
                  placeholder="#5DD3A8"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1">Cor secundaria</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.secondary_color}
                  onChange={(e) => setConfig((p) => ({ ...p, secondary_color: e.target.value }))}
                  className="w-10 h-8 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={config.secondary_color}
                  onChange={(e) => setConfig((p) => ({ ...p, secondary_color: e.target.value }))}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none"
                  placeholder="#C9A96E"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">Dominio customizado</label>
            <input
              type="text"
              value={config.custom_domain}
              onChange={(e) => setConfig((p) => ({ ...p, custom_domain: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5DD3A8]/50"
              placeholder="academia.empresa.com.br"
            />
            <p className="text-[10px] text-white/25 mt-1">
              DNS CNAME apontando para app.vegl.ia (configuracao manual)
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !selectedId}
            className={`w-full font-semibold py-2.5 rounded-xl text-sm transition-colors ${
              saved
                ? "bg-[#4BC495] text-[#0B2545]"
                : "bg-[#5DD3A8] hover:bg-[#4BC495] disabled:opacity-40 text-[#0B2545]"
            }`}
          >
            {saving ? "Salvando..." : saved ? "Configuracoes salvas!" : "Salvar configuracoes"}
          </button>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-white">Preview ao vivo</h2>
          <Preview config={config} />
          <p className="text-xs text-white/30 text-center">
            Previa de como o cliente vera a plataforma
          </p>
        </div>
      </div>
    </div>
  );
}
