"use client";

import { useMemo, useState } from "react";
import {
  Plus, Trash2, Download, FileText, Sparkles, ReceiptIndianRupee,
  Users, Settings2, ArrowUpRight, CheckCircle2, Eye, Menu,
} from "lucide-react";
import { jsPDF } from "jspdf";

type Item = {
  id: number;
  description: string;
  quantity: number;
  rate: number;
};

type GeneratedQuote = {
  title: string;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
  }>;
  terms: string;
  notes: string;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);


// ASCII-only currency formatting for jsPDF's built-in Helvetica font.
const pdfMoney = (value: number) =>
  `INR ${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;

export default function Home() {
  const [business, setBusiness] = useState("Your Studio");
  const [email, setEmail] = useState("hello@example.com");
  const [client, setClient] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [title, setTitle] = useState("Project quotation");
  const [quoteNo, setQuoteNo] = useState("QP-0001");
  const [validDays, setValidDays] = useState("15");
  const [tax, setTax] = useState(18);
  const [discount, setDiscount] = useState(0);
  const [terms, setTerms] = useState("50% advance payment. Remaining balance on completion.");
  const [notes, setNotes] = useState("Thank you for the opportunity to work with you.");
  const [items, setItems] = useState<Item[]>([
    { id: 1, description: "Design and development", quantity: 1, rate: 5000 },
    { id: 2, description: "Revisions and final delivery", quantity: 1, rate: 1500 },
  ]);
  const [nextId, setNextId] = useState(3);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [saved, setSaved] = useState(false);
  const [aiNotes, setAiNotes] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [generatedQuote, setGeneratedQuote] =
    useState<GeneratedQuote | null>(null);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.rate, 0),
    [items]
  );
  const discountAmount = subtotal * Math.min(100, Math.max(0, discount)) / 100;
  const taxable = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxable * Math.min(100, Math.max(0, tax)) / 100;
  const total = taxable + taxAmount;

  async function generateQuote() {
    setAiError("");
    setGeneratedQuote(null);

    if (aiNotes.trim().length < 10) {
      setAiError("Enter at least 10 characters describing the project.");
      return;
    }

    setAiLoading(true);

    try {
      const response = await fetch("/api/generate-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: aiNotes.trim(),
          currency: "INR",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Quote generation failed.");
      }

      setGeneratedQuote(data.quote as GeneratedQuote);
    } catch (error) {
      setAiError(
        error instanceof Error
          ? error.message
          : "Could not generate a quote. Please try again.",
      );
    } finally {
      setAiLoading(false);
    }
  }

  function applyGeneratedQuote() {
    if (!generatedQuote) return;

    const newItems = generatedQuote.items.map((item, index) => ({
      id: nextId + index,
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
    }));

    setTitle(generatedQuote.title);
    setItems(newItems);
    setNextId(nextId + newItems.length);
    setTerms(generatedQuote.terms);
    setNotes(generatedQuote.notes);
    setSaved(false);
    setGeneratedQuote(null);
  }

  function updateItem(id: number, key: keyof Item, value: string) {
    setItems((old) =>
      old.map((item) =>
        item.id !== id
          ? item
          : {
              ...item,
              [key]:
                key === "description"
                  ? value
                  : Math.max(0, Number(value) || 0),
            }
      )
    );
    setSaved(false);
  }

  function addItem() {
    setItems((old) => [
      ...old,
      { id: nextId, description: "", quantity: 1, rate: 0 },
    ]);
    setNextId((id) => id + 1);
    setSaved(false);
  }

  function exportPdf() {
    const today = new Date();
    const days = Math.max(0, Number(validDays) || 0);
    const validUntil = new Date(today);
    validUntil.setDate(validUntil.getDate() + days);

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const left = 16;
    const right = pageWidth - 16;
    const contentWidth = right - left;
    const columns = {
      description: left,
      qty: 130,
      rate: 151,
      amount: right,
    };
    let y = 20;

    const ensureSpace = (height: number) => {
      if (y + height > pageHeight - 18) {
        doc.addPage();
        y = 20;
        return true;
      }
      return false;
    };

    const writeText = (
      value: string,
      x: number,
      top: number,
      width: number,
      size = 10,
      bold = false
    ) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(value, width);
      doc.text(lines, x, top);
      return lines.length * (size * 0.42 + 1.5);
    };

    const drawRule = () => {
      doc.setDrawColor(220, 224, 232);
      doc.setLineWidth(0.3);
      doc.line(left, y, right, y);
    };

    const dateFormat = (date: Date) =>
      date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(business || "Your Business", left, y);
    y += 7;

    if (email) {
      y += writeText(email, left, y, contentWidth, 9);
    }

    y += 3;
    drawRule();
    y += 10;

    y += writeText("QUOTATION", left, y, contentWidth, 16, true);
    y += 2;
    y += writeText(`${title || "Project quotation"}  |  ${quoteNo || "QP-0001"}`, left, y, contentWidth, 10);
    y += 2;
    y += writeText(`Date: ${dateFormat(today)}`, left, y, contentWidth, 10);
    y += 2;
    y += writeText(`Valid until: ${dateFormat(validUntil)}`, left, y, contentWidth, 10);
    y += 7;

    y += writeText("PREPARED FOR", left, y, contentWidth, 9, true);
    y += 1;
    y += writeText(client || "Client name not provided", left, y, contentWidth, 12, true);
    if (clientEmail) {
      y += 2;
      y += writeText(clientEmail, left, y, contentWidth, 10);
    }
    y += 9;

    // Four-column item table
    const descriptionWidth = columns.qty - columns.description - 8;
    const qtyWidth = 12;
    const rateWidth = 25;
    const qtyX = columns.qty;
    const rateX = columns.rate;
    const amountX = columns.amount;

    const drawTableHeader = () => {
      ensureSpace(13);
      doc.setFillColor(245, 247, 250);
      doc.rect(left, y - 5, contentWidth, 10, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(55, 65, 81);
      doc.text("DESCRIPTION", left + 2, y + 1);
      doc.text("QTY", qtyX, y + 1);
      doc.text("RATE", rateX, y + 1);
      doc.text("AMOUNT", amountX, y + 1, { align: "right" });
      doc.setTextColor(0, 0, 0);
      y += 9;
    };

    drawTableHeader();

    items.forEach((item) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);

      const description = (item.description || "Service").trim();
      const descriptionLines = doc.splitTextToSize(
        description,
        descriptionWidth
      );
      const rowHeight = Math.max(9, descriptionLines.length * 4.5 + 4);

      if (ensureSpace(rowHeight + 2)) {
        drawTableHeader();
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text(descriptionLines, left + 2, y + 1);

      doc.text(String(item.quantity), qtyX + qtyWidth / 2, y + 1, {
        align: "center",
      });

      doc.text(pdfMoney(item.rate), rateX + rateWidth, y + 1, {
        align: "right",
      });

      doc.setFont("helvetica", "bold");
      doc.text(pdfMoney(item.quantity * item.rate), amountX, y + 1, {
        align: "right",
      });

      y += rowHeight;
      drawRule();
      y += 4;
    });

    y += 4;
    const summaryRows = [
      [`Subtotal`, pdfMoney(subtotal)],
      [`Discount (${discount}%):`, `-${pdfMoney(discountAmount)}`],
      [`Tax (${tax}%):`, pdfMoney(taxAmount)],
    ];

    summaryRows.forEach(([label, value]) => {
      ensureSpace(8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(label, right - 65, y);
      doc.text(value, right, y, { align: "right" });
      y += 7;
    });

    ensureSpace(15);
    drawRule();
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("TOTAL", right - 65, y);
    doc.text(pdfMoney(total), right, y, { align: "right" });
    y += 12;

    const writeSection = (heading: string, body: string) => {
      const bodyLines = doc.splitTextToSize(body, contentWidth);
      ensureSpace(12 + bodyLines.length * 5);
      y += writeText(heading, left, y, contentWidth, 10, true);
      y += 2;
      y += writeText(body, left, y, contentWidth, 10);
      y += 6;
    };

    writeSection("PAYMENT TERMS", terms || "As agreed with the client.");
    writeSection("NOTES", notes || "No additional notes.");

    ensureSpace(12);
    y += 2;
    writeText("Thank you for your business.", left, y, contentWidth, 10, true);

    doc.save(`${(quoteNo || "quotation").replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`);
  }

  function saveDraft() {
    try {
      localStorage.setItem(
        "quotepilot-draft",
        JSON.stringify({
          business, email, client, clientEmail, title, quoteNo,
          validDays, tax, discount, terms, notes, items, nextId,
        })
      );
      setSaved(true);
    } catch {
      setSaved(false);
      alert("Could not save the draft in this browser.");
    }
  }

  function loadDraft() {
    try {
      const raw = localStorage.getItem("quotepilot-draft");
      if (!raw) {
        alert("No saved draft found in this browser yet.");
        return;
      }
      const data = JSON.parse(raw);
      setBusiness(data.business ?? "Your Studio");
      setEmail(data.email ?? "");
      setClient(data.client ?? "");
      setClientEmail(data.clientEmail ?? "");
      setTitle(data.title ?? "Project quotation");
      setQuoteNo(data.quoteNo ?? "QP-0001");
      setValidDays(data.validDays ?? "15");
      setTax(data.tax ?? 18);
      setDiscount(data.discount ?? 0);
      setTerms(data.terms ?? "");
      setNotes(data.notes ?? "");
      setItems(data.items ?? []);
      setNextId(data.nextId ?? 1);
      setSaved(true);
    } catch {
      alert("The saved draft could not be loaded.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f6fa] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[236px] flex-col border-r border-slate-200 bg-white px-5 py-7 lg:flex">
        <a href="#" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <ReceiptIndianRupee size={22} />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight">QuotePilot</div>
            <div className="text-[11px] text-slate-500">AI QUOTATIONS</div>
          </div>
        </a>

        <div className="mt-12 text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-400">
          Workspace
        </div>
        <nav className="mt-3 space-y-1">
          <a href="#editor" className="flex items-center gap-3 rounded-xl bg-indigo-50 px-3 py-3 text-sm font-semibold text-indigo-700">
            <FileText size={18} /> Quote builder
          </a>
          <button onClick={loadDraft} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-600 hover:bg-slate-50">
            <ReceiptIndianRupee size={18} /> Load saved draft
          </button>
          <a href="#business" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-600 hover:bg-slate-50">
            <Settings2 size={18} /> Business details
          </a>
        </nav>

        <div className="mt-auto rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-indigo-950">
            <Sparkles size={16} /> AI assistant
          </div>
          <p className="mt-2 text-xs leading-5 text-indigo-900/70">
            Turn rough project notes into a structured quotation. Generate editable quotation drafts and review suggested prices before sending.
          </p>
          <div className="mt-3 rounded-lg bg-white px-3 py-2 text-[11px] text-slate-500">
            AI generator available
          </div>
        </div>
      </aside>

      <section className="lg:pl-[236px]">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 lg:hidden"><Menu size={19}/></div>
            <div>
              <div className="text-sm font-semibold">Quote builder</div>
              <div className="text-xs text-slate-500">Create and export a professional quote</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saved && <span className="hidden items-center gap-1 text-xs text-emerald-700 sm:flex"><CheckCircle2 size={14}/> Saved locally</span>}
            <button onClick={saveDraft} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-slate-50 sm:px-4 sm:text-sm">Save draft</button>
            <button onClick={exportPdf} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 sm:px-4 sm:text-sm">
              <Download size={15}/> Export PDF
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] p-4 sm:p-8">
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-indigo-600">
                <Sparkles size={14}/> YOUR BUSINESS, SIMPLIFIED
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Create a quotation</h1>
              <p className="mt-2 text-sm text-slate-500">Everything you need to send a clear, professional proposal.</p>
            </div>
            <div className="flex items-center gap-2 self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 sm:self-auto">
              <span className="h-2 w-2 rounded-full bg-emerald-500"/> Editable draft
            </div>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between text-xs text-slate-500">Quote value <ReceiptIndianRupee size={17}/></div>
              <div className="mt-3 text-xl font-bold">{money(total)}</div>
              <div className="mt-1 text-xs text-slate-400">Including estimated tax</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between text-xs text-slate-500">Line items <FileText size={17}/></div>
              <div className="mt-3 text-xl font-bold">{items.length}</div>
              <div className="mt-1 text-xs text-slate-400">Services or deliverables</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between text-xs text-slate-500">Client <Users size={17}/></div>
              <div className="mt-3 truncate text-xl font-bold">{client || "Not added"}</div>
              <div className="mt-1 text-xs text-slate-400">Quotation recipient</div>
            </div>
          </div>

          <div className="mb-4 flex rounded-xl border border-slate-200 bg-white p-1 lg:hidden">
            <button onClick={() => setActiveTab("edit")} className={`flex-1 rounded-lg py-2 text-sm font-semibold ${activeTab === "edit" ? "bg-indigo-600 text-white" : "text-slate-600"}`}>Edit quote</button>
            <button onClick={() => setActiveTab("preview")} className={`flex-1 rounded-lg py-2 text-sm font-semibold ${activeTab === "preview" ? "bg-indigo-600 text-white" : "text-slate-600"}`}>Preview</button>
          </div>

          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
            <div id="editor" className={`space-y-5 ${activeTab === "preview" ? "hidden lg:block" : ""}`}>
              <section className="rounded-2xl border border-indigo-200 bg-white p-5 sm:p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                    <Sparkles size={19}/>
                  </div>
                  <div>
                    <h2 className="font-semibold">Generate with AI</h2>
                    <p className="text-xs text-slate-500">
                      Turn project notes into editable quotation items.
                    </p>
                  </div>
                </div>

                <label className="block text-xs font-medium text-slate-600">
                  Describe the client&apos;s requirements
                </label>
                <textarea
                  value={aiNotes}
                  onChange={(e) => setAiNotes(e.target.value)}
                  rows={5}
                  maxLength={8000}
                  placeholder="Example: Build a 5-page business website. Client will provide the content. Include responsive design, contact form, testing and deployment. Budget ₹25,000."
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />

                <button
                  type="button"
                  onClick={generateQuote}
                  disabled={aiLoading}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Sparkles size={16}/>
                  {aiLoading ? "Generating quotation..." : "Generate quote"}
                </button>

                {aiError && (
                  <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {aiError}
                  </p>
                )}

                {generatedQuote && (
                  <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                    <h3 className="font-semibold">{generatedQuote.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Review these suggestions before applying them.
                    </p>

                    <div className="mt-3 space-y-2">
                      {generatedQuote.items.map((item, index) => (
                        <div key={index} className="rounded-lg border border-slate-200 bg-white p-3">
                          <div className="text-sm font-medium">{item.description}</div>
                          <div className="mt-3 grid grid-cols-2 gap-3">
                            <label className="text-xs text-slate-500">
                              Quantity
                              <input
                                type="number"
                                min="0.01"
                                step="any"
                                value={item.quantity}
                                onChange={(e) => {
                                  const quantity = Number(e.target.value);
                                  setGeneratedQuote((old) => old ? {
                                    ...old,
                                    items: old.items.map((entry, i) =>
                                      i === index ? { ...entry, quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1 } : entry
                                    ),
                                  } : old);
                                }}
                                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-900"
                              />
                            </label>
                            <label className="text-xs text-slate-500">
                              Rate (₹) — editable estimate
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={item.rate}
                                onChange={(e) => {
                                  const rate = Number(e.target.value);
                                  setGeneratedQuote((old) => old ? {
                                    ...old,
                                    items: old.items.map((entry, i) =>
                                      i === index ? { ...entry, rate: Number.isFinite(rate) && rate >= 0 ? rate : 0 } : entry
                                    ),
                                  } : old);
                                }}
                                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-900"
                              />
                            </label>
                          </div>
                          <div className="mt-2 text-xs text-slate-600">
                            Line total: <strong>{money(item.quantity * item.rate)}</strong>
                          </div>
                          <div className="mt-1 text-xs text-amber-700">
                            AI price suggestion — verify and edit before sending.
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="mt-3 text-xs leading-5 text-slate-600">
                      AI-generated suggestions may be inaccurate. Check descriptions,
                      quantities, prices and terms before sending.
                    </p>

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={applyGeneratedQuote}
                        className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                      >
                        Apply to quotation
                      </button>
                      <button
                        type="button"
                        onClick={() => setGeneratedQuote(null)}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                )}
              </section>

              <section id="business" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600"><Settings2 size={19}/></div>
                  <div><h2 className="font-semibold">Your business</h2><p className="text-xs text-slate-500">How your business appears on the quote</p></div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Business name" value={business} onChange={setBusiness} placeholder="Your Studio"/>
                  <Field label="Business email" value={email} onChange={setEmail} placeholder="hello@example.com"/>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600"><Users size={19}/></div>
                  <div><h2 className="font-semibold">Client and project</h2><p className="text-xs text-slate-500">Basic information about this quotation</p></div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Client name" value={client} onChange={setClient} placeholder="Client or company name"/>
                  <Field label="Client email" value={clientEmail} onChange={setClientEmail} placeholder="client@example.com"/>
                  <Field label="Quotation title" value={title} onChange={setTitle} placeholder="Website redesign"/>
                  <Field label="Quote number" value={quoteNo} onChange={setQuoteNo} placeholder="QP-0001"/>
                  <Field label="Validity (days)" value={validDays} onChange={setValidDays} type="number"/>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div><h2 className="font-semibold">Services and pricing</h2><p className="mt-1 text-xs text-slate-500">Add every service or deliverable</p></div>
                  <button onClick={addItem} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"><Plus size={15}/> Add item</button>
                </div>
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">ITEM {String(index + 1).padStart(2, "0")}</span>
                        <button aria-label="Remove item" onClick={() => {setItems(old => old.filter(x => x.id !== item.id)); setSaved(false);}} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15}/></button>
                      </div>
                      <input value={item.description} onChange={e => updateItem(item.id, "description", e.target.value)} placeholder="Describe the service" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"/>
                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <Field label="Quantity" value={String(item.quantity)} onChange={v => updateItem(item.id, "quantity", v)} type="number"/>
                        <Field label="Rate (₹)" value={String(item.rate)} onChange={v => updateItem(item.id, "rate", v)} type="number"/>
                        <div className="col-span-2 sm:col-span-1"><div className="text-xs text-slate-500">Amount</div><div className="mt-2 text-sm font-bold">{money(item.quantity * item.rate)}</div></div>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center text-sm text-slate-500">No items yet. Add your first service.</div>}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <h2 className="font-semibold">Taxes and adjustments</h2>
                <p className="mb-5 mt-1 text-xs text-slate-500">Check the correct tax treatment for your business.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Tax rate (%)" value={String(tax)} onChange={v => setTax(Math.min(100, Math.max(0, Number(v) || 0)))} type="number"/>
                  <Field label="Discount (%)" value={String(discount)} onChange={v => setDiscount(Math.min(100, Math.max(0, Number(v) || 0)))} type="number"/>
                </div>
                <div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
                  <Summary label="Subtotal" value={money(subtotal)}/>
                  <Summary label={`Discount (${discount}%)`} value={`−${money(discountAmount)}`}/>
                  <Summary label={`Tax (${tax}%)`} value={money(taxAmount)}/>
                  <div className="border-t border-slate-200 pt-3"><Summary label="Total" value={money(total)} strong/></div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <h2 className="font-semibold">Terms and notes</h2>
                <label className="mt-4 block text-xs font-medium text-slate-600">Payment terms</label>
                <textarea value={terms} onChange={e => setTerms(e.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"/>
                <label className="mt-4 block text-xs font-medium text-slate-600">Message to client</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"/>
              </section>
              <button onClick={saveDraft} className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold hover:bg-slate-50">Save quotation draft in this browser</button>
            </div>

            <div className={`${activeTab === "edit" ? "hidden lg:block" : ""} xl:sticky xl:top-[90px]`}>
              <div className="mb-3 flex items-center justify-between">
                <div><h2 className="text-sm font-semibold">Live preview</h2><p className="mt-1 text-xs text-slate-500">Updates as you edit</p></div>
                <button onClick={exportPdf} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-slate-50"><Eye size={14}/> Export PDF <ArrowUpRight size={13}/></button>
              </div>
              <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="h-2 bg-indigo-600"/>
                <div className="p-5 sm:p-8">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><div className="break-words text-lg font-bold">{business || "Your Business"}</div><div className="mt-1 break-all text-xs text-slate-500">{email}</div></div>
                    <div className="shrink-0 rounded-lg bg-indigo-50 px-3 py-2 text-right"><div className="text-[9px] font-bold tracking-widest text-indigo-700">QUOTATION</div><div className="mt-1 text-xs font-semibold">{quoteNo}</div></div>
                  </div>
                  <div className="my-6 border-t border-slate-200"/>
                  <div className="text-xs text-slate-500">PROJECT PROPOSAL</div>
                  <h3 className="mt-1 break-words text-xl font-bold">{title || "Project quotation"}</h3>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div><div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Prepared for</div><div className="mt-1 break-words text-sm font-semibold">{client || "Client name"}</div><div className="mt-1 break-all text-xs text-slate-500">{clientEmail}</div></div>
                    <div><div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Issue date</div><div className="mt-1 text-sm font-medium">Set on PDF export</div><div className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Valid until</div><div className="mt-1 text-sm font-medium">{validDays} days after issue</div></div>
                  </div>
                  <div className="mt-7 overflow-hidden rounded-xl border border-slate-200">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 bg-slate-50 px-3 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500"><span>Description</span><span className="text-right">Amount</span></div>
                    {items.map(item => <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 border-t border-slate-100 px-3 py-3 text-xs"><div className="min-w-0"><div className="break-words font-medium">{item.description || "Untitled service"}</div><div className="mt-1 text-slate-500">{item.quantity} × {money(item.rate)}</div></div><div className="whitespace-nowrap text-right font-semibold">{money(item.quantity * item.rate)}</div></div>)}
                    {items.length === 0 && <div className="p-4 text-xs text-slate-400">Your line items will appear here.</div>}
                  </div>
                  <div className="ml-auto mt-5 max-w-[260px] space-y-3">
                    <Summary label="Subtotal" value={money(subtotal)}/>
                    <Summary label={`Discount (${discount}%)`} value={`−${money(discountAmount)}`}/>
                    <Summary label={`Tax (${tax}%)`} value={money(taxAmount)}/>
                    <div className="rounded-xl bg-indigo-600 p-4 text-white"><div className="text-xs text-indigo-100">Total quotation value</div><div className="mt-1 text-2xl font-bold">{money(total)}</div><div className="mt-1 text-[10px] text-indigo-100">All amounts in INR</div></div>
                  </div>
                  <div className="mt-7 border-t border-slate-200 pt-5">
                    <div className="text-xs font-bold">Payment terms</div>
                    <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-slate-500">{terms || "As agreed with the client."}</p>
                    <div className="mt-4 text-xs font-bold">A note from us</div>
                    <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-slate-500">{notes}</p>
                  </div>
                  <div className="mt-8 rounded-xl bg-slate-50 p-4 text-center"><div className="text-sm font-semibold">Thank you for your business.</div><div className="mt-1 break-all text-xs text-slate-500">{email}</div></div>
                </div>
              </article>
              <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">Preview for review. Confirm tax, pricing and payment terms before sending.</p>
            </div>
          </div>
          <footer className="mt-10 flex flex-col justify-between gap-2 border-t border-slate-200 py-5 text-xs text-slate-400 sm:flex-row">
            <span>QuotePilot AI · Early MVP</span><span>Quotation data stays in this browser unless you export or share it.</span>
          </footer>
        </div>
      </section>
    </main>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-xs font-medium text-slate-600">{label}</span>
      <input
        type={type}
        min={type === "number" ? 0 : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />
    </label>
  );
}

function Summary({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${strong ? "text-base font-bold" : "text-xs text-slate-500"}`}>
      <span>{label}</span><span className={strong ? "text-slate-900" : "text-slate-700"}>{value}</span>
    </div>
  );
}
