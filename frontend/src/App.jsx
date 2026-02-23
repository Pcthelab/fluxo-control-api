import React, { useEffect, useMemo, useState } from "react";
import api, { setToken, clearToken, getToken } from "./api";
import "./App.css";

const CATEGORIAS = [
    { value: "SALARIO", label: "Salário" },
    { value: "FREELANCE", label: "Freelance" },
    { value: "INVESTIMENTO", label: "Investimento" },
    { value: "PRESENTE", label: "Presente" },
    { value: "ALIMENTACAO", label: "Alimentação" },
    { value: "TRANSPORTE", label: "Transporte" },
    { value: "MORADIA", label: "Moradia" },
    { value: "SAUDE", label: "Saúde" },
    { value: "LAZER", label: "Lazer" },
    { value: "EDUCACAO", label: "Educação" },
    { value: "ASSINATURAS", label: "Assinaturas" },
    { value: "OUTRO", label: "Outro" },
];

function brl(v) {
    const n = Number(v || 0);
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function todayISO() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function mesLabel(yyyyMM) {
    if (!yyyyMM || yyyyMM.length !== 7) return yyyyMM || "";
    const [y, m] = yyyyMM.split("-");
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const idx = Math.max(1, Math.min(12, Number(m))) - 1;
    return `${meses[idx]}/${y}`;
}

function horaMin(d) {
    if (!d) return "";
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
}

function sanitizeMoneyInput(raw) {
    const s = String(raw ?? "");
    const cleaned = s.replace(/[^\d.,]/g, "");

    let out = "";
    let sepUsed = false;

    for (const ch of cleaned) {
        if (ch === "," || ch === ".") {
            if (sepUsed) continue;
            sepUsed = true;
            out += ch;
        } else {
            out += ch;
        }
    }

    out = out.replace(/^[.,]/, "");
    if (out.length > 15) out = out.slice(0, 15);
    return out;
}

export default function App() {
    const [tab, setTab] = useState("login");
    const [view, setView] = useState("home");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    // ✅ menu (substitui botão dashboard)
    const [menuOpen, setMenuOpen] = useState(false);

    // ✅ meta mensal (localStorage)
    const [metaMensal, setMetaMensal] = useState(() => {
        const v = localStorage.getItem("metaMensal");
        return v ? Number(v) : 2000;
    });

    useEffect(() => {
        localStorage.setItem("metaMensal", String(metaMensal || 0));
    }, [metaMensal]);

    // auth
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [logged, setLogged] = useState(!!getToken());

    // home data
    const [resumo, setResumo] = useState({ saldo: 0, receitas: 0, despesas: 0 });
    const [lancamentos, setLancamentos] = useState([]);
    const [lastUpdated, setLastUpdated] = useState(null);

    const [mesRef, setMesRef] = useState("ALL");
    const [showAll, setShowAll] = useState(false);

    const mesesDisponiveis = useMemo(() => {
        const set = new Set();
        for (const l of lancamentos) {
            const d = (l?.data || "").slice(0, 7);
            if (d && d.length === 7) set.add(d);
        }
        return Array.from(set).sort().reverse();
    }, [lancamentos]);

    const lancamentosFiltrados = useMemo(() => {
        if (mesRef === "ALL") return lancamentos;
        return lancamentos.filter((l) => (l?.data || "").slice(0, 7) === mesRef);
    }, [lancamentos, mesRef]);

    const resumoExibido = useMemo(() => {
        if (mesRef === "ALL") return resumo;
        let receitas = 0;
        let despesas = 0;
        for (const l of lancamentosFiltrados) {
            const v = Number(l?.valor || 0);
            if (l?.tipo === "RECEITA") receitas += v;
            else despesas += v;
        }
        return { receitas, despesas, saldo: receitas - despesas };
    }, [mesRef, resumo, lancamentosFiltrados]);

    // modal
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [tipo, setTipo] = useState("DESPESA");
    const [categoria, setCategoria] = useState("ALIMENTACAO");
    const [descricao, setDescricao] = useState("");
    const [valor, setValor] = useState("");
    const [data, setData] = useState(todayISO());

    useMemo(() => "Fluxo Control", []);

    function resetForm() {
        setEditId(null);
        setTipo("DESPESA");
        setCategoria("ALIMENTACAO");
        setDescricao("");
        setValor("");
        setData(todayISO());
    }

    async function carregarDados({ silent = false } = {}) {
        if (!silent) setMsg("");

        const token = getToken();
        if (!token) {
            setMsg("Sua sessão expirou. Faça login novamente.");
            setLogged(false);
            return;
        }

        setLoading(true);
        let ok = false;

        try {
            const r = await api("/api/lancamentos/resumo");
            setResumo({
                saldo: Number(r?.saldo ?? 0),
                receitas: Number(r?.totalReceitas ?? 0),
                despesas: Number(r?.totalDespesas ?? 0),
            });

            const list = await api("/api/lancamentos");
            setLancamentos(Array.isArray(list) ? list : []);
            ok = true;
        } catch (e) {
            if (!getToken()) setLogged(false);
            setMsg(e?.message || "Erro ao carregar");
        } finally {
            setLoading(false);
            if (ok) setLastUpdated(new Date());
        }
    }

    useEffect(() => {
        if (logged) carregarDados({ silent: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [logged]);

    async function onLogin(e) {
        e.preventDefault();
        setMsg("");
        setLoading(true);
        try {
            const r = await api("/auth/login", "POST", { email, senha });
            setToken(r.token);
            setLogged(true);
        } catch (err) {
            setMsg(err?.message || "Login falhou");
        } finally {
            setLoading(false);
        }
    }

    async function onCadastro(e) {
        e.preventDefault();
        setMsg("");
        setLoading(true);
        try {
            await api("/auth/cadastro", "POST", { nome, email, senha });
            setTab("login");
            setMsg("Conta criada. Agora faz login.");
        } catch (err) {
            setMsg(err?.message || "Cadastro falhou");
        } finally {
            setLoading(false);
        }
    }

    function sair() {
        clearToken();
        setLogged(false);
        setResumo({ saldo: 0, receitas: 0, despesas: 0 });
        setLancamentos([]);
        setEmail("");
        setSenha("");
        setNome("");
        setMsg("");
        setTab("login");
        setView("home");
        setMesRef("ALL");
        setShowAll(false);
        setLastUpdated(null);
        resetForm();
        setOpen(false);
        setMenuOpen(false);
    }

    function exportarCSV() {
        const header = ["id", "tipo", "categoria", "descricao", "valor", "data"];
        const linhas = (Array.isArray(lancamentos) ? lancamentos : []).map((l) => [
            l?.id ?? "",
            l?.tipo ?? "",
            l?.categoria ?? "",
            (l?.descricao ?? "").toString().replace(/\r?\n/g, " "),
            l?.valor ?? "",
            l?.data ?? "",
        ]);

        const esc = (v) => {
            const s = String(v ?? "");
            const needs = /[;\n\"]/g.test(s);
            const out = s.replace(/"/g, '""');
            return needs ? `"${out}"` : out;
        };

        const csv = [header.join(";"), ...linhas.map((row) => row.map(esc).join(";"))].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `lancamentos-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    const despesas = lancamentos.filter((l) => l?.tipo === "DESPESA");
    const topDespesas = despesas
        .slice()
        .sort((a, b) => Number(b?.valor || 0) - Number(a?.valor || 0))
        .slice(0, 5);

    function abrirEdicao(l) {
        setMsg("");
        setEditId(l.id);
        setTipo(l.tipo || "DESPESA");
        setCategoria(l.categoria || "ALIMENTACAO");
        setDescricao(l.descricao || "");
        setValor(String(l.valor ?? ""));
        setData((l.data || todayISO()).slice(0, 10));
        setOpen(true);
    }

    function abrirCriacao() {
        setMsg("");
        resetForm();
        setOpen(true);
    }

    function fecharModal() {
        setOpen(false);
        resetForm();
    }

    async function criarLancamento(e) {
        e.preventDefault();
        setMsg("");
        setLoading(true);

        const v = Number(String(valor).replace(",", "."));
        if (!descricao.trim()) {
            setLoading(false);
            return setMsg("Descrição é obrigatória.");
        }
        if (!Number.isFinite(v) || v <= 0) {
            setLoading(false);
            return setMsg("Valor inválido.");
        }

        try {
            if (editId) {
                await api(`/api/lancamentos/${editId}`, "PUT", {
                    tipo,
                    categoria,
                    descricao: descricao.trim(),
                    valor: v,
                    data,
                });
            } else {
                await api("/api/lancamentos", "POST", {
                    tipo,
                    categoria,
                    descricao: descricao.trim(),
                    valor: v,
                    data,
                });
            }

            fecharModal();
            await carregarDados({ silent: true });
        } catch (err) {
            if (!getToken()) setLogged(false);
            setMsg(err?.message || (editId ? "Não consegui salvar edição." : "Não consegui criar lançamento."));
        } finally {
            setLoading(false);
        }
    }

    async function deletarLancamento(l) {
        const id = l?.id;
        if (!id) return;

        const ok = window.confirm(`Excluir "${l?.descricao || "lançamento"}"?`);
        if (!ok) return;

        setMsg("");
        setLoading(true);
        try {
            await api(`/api/lancamentos/${id}`, "DELETE");
            await carregarDados({ silent: true });
        } catch (err) {
            if (!getToken()) setLogged(false);
            setMsg(err?.message || "Não consegui deletar.");
        } finally {
            setLoading(false);
        }
    }

    // ---------- UI ----------
    if (!logged) {
        return (
            <div className="page">
                <div className="card authCard">
                    <div className="authTop">
                        <div className="appBadge">FC</div>
                        <div className="authTitle">
                            <div className="brand">
                                <span className="brandA">Fluxo</span> <span className="brandB">Control</span>
                            </div>
                            <div className="subtitle">Entre para continuar</div>
                        </div>
                    </div>

                    <div className="segmented">
                        <button className={tab === "login" ? "seg active" : "seg"} onClick={() => setTab("login")} type="button">
                            Login
                        </button>
                        <button className={tab === "cadastro" ? "seg active" : "seg"} onClick={() => setTab("cadastro")} type="button">
                            Cadastro
                        </button>
                    </div>

                    {msg ? <div className="msg">{msg}</div> : null}

                    {tab === "login" ? (
                        <form onSubmit={onLogin} className="form">
                            <label className="field">
                                <span>Email</span>
                                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" autoComplete="email" />
                            </label>
                            <label className="field">
                                <span>Senha</span>
                                <input value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" type="password" autoComplete="current-password" />
                            </label>

                            <button className="primary" disabled={loading}>
                                {loading ? "Entrando..." : "Entrar"}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={onCadastro} className="form">
                            <label className="field">
                                <span>Nome</span>
                                <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" autoComplete="name" />
                            </label>
                            <label className="field">
                                <span>Email</span>
                                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" autoComplete="email" />
                            </label>
                            <label className="field">
                                <span>Senha</span>
                                <input value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="crie uma senha" type="password" autoComplete="new-password" />
                            </label>

                            <button className="primary" disabled={loading}>
                                {loading ? "Criando..." : "Criar conta"}
                            </button>
                        </form>
                    )}

                    <div className="footer">Created by Pcthelab</div>
                </div>
            </div>
        );
    }

    const visibleLancamentos = showAll ? lancamentosFiltrados : lancamentosFiltrados.slice(0, 8);

    return (
        <div className="page">
            <div className="shell">
                <header className="topbar">
                        <div className="left">
                            <div className="appBadge small">FC</div>

                            <div className="brandSmall">
                                <span className="brandA">Fluxo</span>{" "}
                                <span className="brandB">Control</span>
                                <div className="subtitle small">
                                    {lastUpdated ? `Atualizado ${horaMin(lastUpdated)}` : "Bem-vindo"}
                                </div>
                            </div>


                            <div className="leftActions">
                                <button
                                    className="ghost"
                                    onClick={() => carregarDados()}
                                    disabled={loading}
                                    title="Recarregar dados"
                                >
                                    {loading ? "Atualizando..." : "Atualizar"}
                                </button>

                                <button className="danger" onClick={sair}>
                                    Sair
                                </button>
                            </div>
                        </div>


                        <div className="rightMenu">
                            <button
                                className="ghost secondary menuBtn"
                                type="button"
                                onClick={() => setMenuOpen((v) => !v)}
                                title="Menu"
                            >
                                ☰
                            </button>

                            {menuOpen ? (
                                <div className="menuDropdown">
                                    <button
                                        className="menuItem"
                                        type="button"
                                        onClick={() => {
                                            setView("home");
                                            setMenuOpen(false);
                                        }}
                                    >
                                        Home
                                    </button>

                                    <button
                                        className="menuItem"
                                        type="button"
                                        onClick={() => {
                                            setView("dash");
                                            setMenuOpen(false);
                                        }}
                                    >
                                        Dashboard
                                    </button>

                                    <button
                                        className="menuItem"
                                        type="button"
                                        onClick={() => {
                                            exportarCSV();
                                            setMenuOpen(false);
                                        }}
                                    >
                                        Exportar CSV
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </header>

                {msg ? <div className="msg wide">{msg}</div> : null}


                <section className="card summaryCard">
                    <div className="summaryRow">
                        <div className="summaryLabel">Saldo</div>
                        <div className={"summaryValue " + (resumoExibido.saldo < 0 ? "neg" : "pos")}>{brl(resumoExibido.saldo)}</div>
                    </div>

                    <div className="summaryDivider" />

                    <div className="summaryGrid">
                        <div className="summaryMini">
                            <div className="summaryMiniLabel">Receitas</div>
                            <div className="summaryMiniValue pos">{brl(resumoExibido.receitas)}</div>
                        </div>

                        <div className="summaryMini">
                            <div className="summaryMiniLabel">Despesas</div>
                            <div className="summaryMiniValue neg">{brl(resumoExibido.despesas)}</div>
                        </div>
                    </div>
                </section>


                <section className="card listCard metaCard" style={{ marginTop: 14, marginBottom: 16 }}>
                    <div className="listHeader metaHeader">
                        <div>
                            <div className="h2">Meta do mês</div>
                            <div className="subtitle">
                                {mesRef === "ALL" ? "Dica: selecione um mês pra meta fazer mais sentido" : `Meta para: ${mesLabel(mesRef)}`}
                            </div>
                        </div>

                        <div className="metaRight">
                            <span className="metaLabel">Meta</span>
                            <input
                                className="metaInput"
                                value={metaMensal}
                                onChange={(e) => setMetaMensal(Number(String(e.target.value).replace(/[^\d]/g, "")))}
                                inputMode="numeric"
                                placeholder="2000"
                            />
                        </div>
                    </div>

                    {(() => {
                        const gasto = Number(resumoExibido.despesas || 0);
                        const meta = Number(metaMensal || 0);
                        const pct = meta > 0 ? Math.min(100, Math.round((gasto / meta) * 100)) : 0;
                        const estourou = meta > 0 && gasto > meta;

                        return (
                            <div style={{ marginTop: 12 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                    <div className="kpiLabel">Gasto no período</div>
                                    <div style={{ fontWeight: 900, color: estourou ? "#b3202a" : "#0f1a14" }}>
                                        {brl(gasto)} {meta > 0 ? `(${pct}%)` : ""}
                                    </div>
                                </div>

                                <div className={`progress ${estourou ? "danger" : ""}`}>
                                    <div className="progressBar" style={{ width: `${pct}%` }} />
                                </div>

                                <div className="subtitle" style={{ marginTop: 8 }}>
                                    {meta > 0
                                        ? estourou
                                            ? `Você passou da meta em ${brl(gasto - meta)}`
                                            : `Faltam ${brl(Math.max(0, meta - gasto))} pra bater a meta`
                                        : "Defina uma meta (ex: 2000) pra ver a barra."}
                                </div>
                            </div>
                        );
                    })()}
                </section>

                {/* ✅ Conteúdo principal */}
                {view === "home" ? (
                    <section className="card listCard">
                        <div>
                            <div className="h2">Últimos lançamentos</div>
                            <div className="subtitle">Toque no + pra adicionar</div>
                        </div>

                        <div className="listActions">
                            <select
                                className="monthSelect"
                                value={mesRef}
                                onChange={(e) => {
                                    setMesRef(e.target.value);
                                    setShowAll(false);
                                }}
                                title="Filtrar por mês"
                            >
                                <option value="ALL">Todos</option>
                                {mesesDisponiveis.map((m) => (
                                    <option key={m} value={m}>
                                        {mesLabel(m)}
                                    </option>
                                ))}
                            </select>

                            <button className="addInline" type="button" onClick={abrirCriacao} title="Novo lançamento">
                                +
                            </button>

                            {lancamentosFiltrados.length > 8 ? (
                                <button className="ghost" type="button" onClick={() => setShowAll((v) => !v)} title="Alternar quantidade">
                                    {showAll ? "Mostrar menos" : "Ver todos"}
                                </button>
                            ) : null}
                        </div>

                        {lancamentosFiltrados.length === 0 ? (
                            <div className="empty">
                                <div className="emptyTitle">0 itens</div>
                                <div className="emptyText">Nada por aqui ainda.</div>
                            </div>
                        ) : (
                            <div className="list">
                                {visibleLancamentos.map((l) => (
                                    <div key={l.id} className="row">
                                        <div className="rowLeft">
                                            <div className="rowTitle">{l.descricao}</div>
                                            <div className="rowMeta">
                                                <span className={l.tipo === "RECEITA" ? "pill pillPos" : "pill pillNeg"}>{l.categoria}</span>
                                                <span className="dot">•</span>
                                                <span className="muted">{String(l.data)}</span>
                                            </div>
                                        </div>

                                        <div className="rowRight">
                                            <div className={l.tipo === "RECEITA" ? "money pos" : "money neg"}>
                                                {l.tipo === "RECEITA" ? "+" : "-"} {brl(l.valor)}
                                            </div>
                                            <button className="edit" onClick={() => abrirEdicao(l)} title="Editar">
                                                ✎
                                            </button>
                                            <button className="trash" onClick={() => deletarLancamento(l)} title="Excluir">
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                ) : (
                    <section className="card listCard">
                        <div className="listHeader" style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                            <div>
                                <div className="h2">Dashboard</div>
                                <div className="subtitle">Top despesas</div>
                            </div>
                            <div>
                                <button className="ghost" onClick={exportarCSV}>
                                    Exportar CSV
                                </button>
                            </div>
                        </div>

                        {topDespesas.length === 0 ? (
                            <div className="empty">
                                <div className="emptyTitle">Sem despesas ainda</div>
                                <div className="emptyText">Quando você lançar despesas, o top 5 aparece aqui.</div>
                            </div>
                        ) : (
                            <div className="list">
                                {topDespesas.map((l) => (
                                    <div key={`top-${l.id}`} className="row">
                                        <div className="rowLeft">
                                            <div className="rowTitle">{l.descricao}</div>
                                            <div className="rowMeta">
                                                <span className="pill pillNeg">{l.categoria}</span>
                                                <span className="dot">•</span>
                                                <span className="muted">{String(l.data)}</span>
                                            </div>
                                        </div>

                                        <div className="rowRight">
                                            <div className="money neg">- {brl(l.valor)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {open ? (
                    <div className="modalOverlay" onMouseDown={() => fecharModal()}>
                        <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
                            <div className="modalTop">
                                <div>
                                    <div className="h2">{editId ? "Editar lançamento" : "Novo lançamento"}</div>
                                    <div className="subtitle">Escolha o tipo e preencha os dados</div>
                                </div>
                                <button className="icon" onClick={() => fecharModal()} title="Fechar">
                                    ✕
                                </button>
                            </div>

                            <div className="segmented big">
                                <button type="button" className={tipo === "DESPESA" ? "seg active dangerSeg" : "seg"} onClick={() => setTipo("DESPESA")}>
                                    Despesa
                                </button>
                                <button type="button" className={tipo === "RECEITA" ? "seg active okSeg" : "seg"} onClick={() => setTipo("RECEITA")}>
                                    Receita
                                </button>
                            </div>

                            <form className="form" onSubmit={criarLancamento}>
                                <label className="field">
                                    <span>Categoria</span>
                                    <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                                        {CATEGORIAS.map((c) => (
                                            <option key={c.value} value={c.value}>
                                                {c.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="field">
                                    <span>Descrição</span>
                                    <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="ex: Mercado / Uber" />
                                </label>

                                <div className="row2">
                                    <label className="field">
                                        <span>Valor</span>
                                        <input value={valor} onChange={(e) => setValor(sanitizeMoneyInput(e.target.value))} placeholder="ex: 35,90" inputMode="decimal" />
                                    </label>

                                    <label className="field">
                                        <span>Data</span>
                                        <input value={data} onChange={(e) => setData(e.target.value)} type="date" className={"dateInput"} />
                                    </label>
                                </div>

                                <div className="modalActions">
                                    <button type="button" className="ghost" onClick={fecharModal} disabled={loading}>
                                        Cancelar
                                    </button>

                                    <button className={tipo === "RECEITA" ? "primary okBtn" : "primary dangerBtn"} disabled={loading}>
                                        {loading ? "Salvando..." : editId ? "Salvar" : "Adicionar"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : null}

                <div className="footerWide">Created by Pcthelab</div>
            </div>
        </div>
    );
}