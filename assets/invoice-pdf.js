/**
 * Client-side invoice PDF — generates a real PDF blob and triggers download
 * (no print dialog). Uses vendored jsPDF at /assets/jspdf.umd.min.js (window.jspdf).
 */
(function (global) {
  /** Prefer same-origin vendor; CDN path historically 404'd on cdnjs for 2.5.2. */
  const JSPDF_SRC = '/assets/jspdf.umd.min.js';

  function money(cents, currency) {
    const amount = (Number(cents) || 0) / 100;
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD'
      }).format(amount);
    } catch {
      return `$${amount.toFixed(2)}`;
    }
  }

  function parseDollarsToCents(value) {
    if (value == null) return null;
    if (typeof value === 'number') {
      return Number.isFinite(value) ? Math.round(value * 100) : null;
    }
    let s = String(value).trim();
    if (!s) return null;
    s = s.replace(/\$/g, '').replace(/,/g, '').replace(/\s/g, '');
    if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
    const n = Number(s);
    return Number.isFinite(n) ? Math.round(n * 100) : null;
  }

  function centsToDollarsInput(cents) {
    return ((Number(cents) || 0) / 100).toFixed(2);
  }

  function parseDecimal(value) {
    if (value == null) return null;
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }
    let s = String(value).trim().replace(/,/g, '').replace(/\s/g, '');
    if (!s) return null;
    if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function hasAch(ach) {
    if (!ach || typeof ach !== 'object') return false;
    return Boolean(
      ach.routing_number ||
        ach.account_number ||
        ach.routing ||
        ach.account
    );
  }

  function maskAccountNumber(account) {
    const digits = String(account || '').replace(/\s/g, '');
    if (!digits) return '';
    if (digits.length <= 4) return `••••${digits}`;
    return `••••${digits.slice(-4)}`;
  }

  function maskRoutingNumber(routing) {
    const digits = String(routing || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length <= 4) return `••••${digits}`;
    return `${digits.slice(0, 2)}••••${digits.slice(-2)}`;
  }

  /** Only routing + account (legacy extra fields ignored). */
  function achDetailRows(ach, { masked = false } = {}) {
    if (!hasAch(ach)) return [];
    const rows = [];
    const applyMask = masked && !ach.revealed && !ach.masked;
    const routing = ach.routing_number || ach.routing || '';
    const account = ach.account_number || ach.account || '';
    if (routing) {
      rows.push([
        'Routing number',
        applyMask ? maskRoutingNumber(routing) : routing
      ]);
    }
    if (account) {
      rows.push([
        'Account number',
        applyMask ? maskAccountNumber(account) : account
      ]);
    }
    return rows;
  }

  function safeFilename(number) {
    const raw = String(number || 'invoice')
      .replace(/[^\w.-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
    return `invoice-${raw || 'invoice'}.pdf`;
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (global.jspdf?.jsPDF) return resolve();
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        const wait = setInterval(() => {
          if (global.jspdf?.jsPDF) {
            clearInterval(wait);
            resolve();
          }
        }, 40);
        setTimeout(() => {
          clearInterval(wait);
          reject(new Error('jsPDF failed to load'));
        }, 8000);
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = () => {
        if (global.jspdf?.jsPDF) resolve();
        else reject(new Error('jsPDF loaded but global missing'));
      };
      s.onerror = () => reject(new Error('Failed to load jsPDF'));
      document.head.appendChild(s);
    });
  }

  async function ensureJsPdf() {
    if (global.jspdf?.jsPDF) return global.jspdf.jsPDF;
    await loadScript(JSPDF_SRC);
    if (!global.jspdf?.jsPDF) throw new Error('jsPDF is not available');
    return global.jspdf.jsPDF;
  }

  function wrapText(doc, text, maxWidth) {
    return doc.splitTextToSize(String(text || ''), maxWidth);
  }

  /**
   * Build a branded invoice PDF and download as invoice-XXX.pdf.
   * @returns {Promise<boolean>}
   */
  async function exportInvoicePdf({ invoice, clientName } = {}) {
    const inv = invoice || {};
    const currency = inv.currency || 'USD';
    const comments = String(inv.comments || inv.notes || '').trim();
    const ach = inv.ach || null;
    const filename = safeFilename(inv.number);

    let jsPDF;
    try {
      jsPDF = await ensureJsPdf();
    } catch (err) {
      console.error(err);
      alert('Could not load the PDF library. Check your connection and try again.');
      return false;
    }

    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 50;
    const footerH = 36;
    const contentBottom = pageH - margin - footerH;
    const contentW = pageW - margin * 2;
    let y = margin;
    let pageNum = 1;

    // Fixed column grid — money cols clustered on the right, shared right edges
    const gapDesc = 16;
    const gapMoney = 10;
    const qtyW = 36;
    const unitW = 72;
    const amtW = 78;
    const descW = contentW - qtyW - unitW - amtW - gapDesc - gapMoney * 2;
    const col = {
      desc: margin,
      qty: margin + descW + gapDesc + qtyW,
      unit: margin + descW + gapDesc + qtyW + gapMoney + unitW,
      amt: pageW - margin
    };

    const ink = [8, 8, 8];
    const mute = [104, 104, 104];
    const accent = [110, 193, 119];
    const soft = [50, 50, 50];
    const rule = [224, 224, 224];
    const rowRule = [232, 232, 232];
    const band = [248, 248, 248];
    const lineH = 13;
    const selLineH = 11;
    const rowPadY = 6;

    function drawFooter() {
      const fy = pageH - margin + 4;
      doc.setDrawColor(...rule);
      doc.setLineWidth(0.6);
      doc.line(margin, fy - 14, pageW - margin, fy - 14);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...mute);
      doc.text('Advanced Autoponics, LLC · Lakewood, CO · Client invoice portal', margin, fy);
      doc.text(String(pageNum), pageW - margin, fy, { align: 'right' });
    }

    function ensureSpace(needed) {
      if (y + needed <= contentBottom) return;
      drawFooter();
      doc.addPage();
      pageNum += 1;
      y = margin;
    }

    function drawWrappedLines(lines, x, startY, opts = {}) {
      const { fontSize = 10, color = ink, font = 'normal', leading = lineH } = opts;
      doc.setFont('helvetica', font);
      doc.setFontSize(fontSize);
      doc.setTextColor(...color);
      let cy = startY;
      lines.forEach((line) => {
        ensureSpace(leading + 2);
        doc.setFont('helvetica', font);
        doc.setFontSize(fontSize);
        doc.setTextColor(...color);
        doc.text(line, x, cy);
        cy += leading;
      });
      return cy;
    }

    // —— Header: brand left / invoice meta right ——
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...ink);
    doc.text('ADVANCED AUTOPONICS', margin, y + 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...mute);
    doc.text('Advanced Autoponics, LLC', margin, y + 30);
    doc.text('Lakewood, CO', margin, y + 42);
    doc.text('billing@advancedautoponics.com', margin, y + 54);

    const metaX = pageW - margin;
    const metaLabelX = metaX - 118;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...ink);
    doc.text(String(inv.number || 'Invoice'), metaX, y + 14, { align: 'right' });

    const metaRows = [
      ['Issued', inv.issue_date || '—'],
      ['Due', inv.due_date || '—'],
      ['Status', String(inv.status || 'sent').toUpperCase()]
    ];
    let metaY = y + 34;
    metaRows.forEach(([label, value], i) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...mute);
      doc.text(label, metaLabelX, metaY);
      doc.setFont('helvetica', i === 2 ? 'bold' : 'normal');
      doc.setTextColor(...(i === 2 ? accent : soft));
      doc.text(String(value), metaX, metaY, { align: 'right' });
      metaY += 14;
    });

    y = Math.max(y + 68, metaY + 6);
    doc.setDrawColor(...ink);
    doc.setLineWidth(1.75);
    doc.line(margin, y, pageW - margin, y);
    doc.setDrawColor(...accent);
    doc.setLineWidth(2.5);
    doc.line(margin, y, margin + 48, y);
    y += 22;

    // —— Bill to ——
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...mute);
    doc.text('BILL TO', margin, y);
    y += 13;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(...ink);
    const billLines = wrapText(doc, String(clientName || '—'), contentW * 0.55);
    billLines.forEach((line) => {
      doc.text(line, margin, y);
      y += 14;
    });
    y += 14;

    // —— Line-item table ——
    function drawTableHeader() {
      ensureSpace(28);
      doc.setFillColor(...band);
      doc.rect(margin, y - 8, contentW, 22, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...mute);
      doc.text('SERVICE / DESCRIPTION', col.desc, y + 4);
      doc.text('QTY', col.qty, y + 4, { align: 'right' });
      doc.text('UNIT', col.unit, y + 4, { align: 'right' });
      doc.text('AMOUNT', col.amt, y + 4, { align: 'right' });
      y += 18;
      doc.setDrawColor(...rule);
      doc.setLineWidth(0.6);
      doc.line(margin, y, pageW - margin, y);
      y += 12;
    }

    drawTableHeader();

    const items = inv.line_items || [];
    items.forEach((item, idx) => {
      const amount = Math.round(
        (Number(item.quantity) || 0) * (Number(item.unit_price_cents) || 0)
      );
      const selection = String(item.selection_label || item.selection || '').trim();
      const description = String(item.description || '').trim();

      // Wrap first — row height is derived only from wrapped lines
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      const selLines = selection
        ? wrapText(doc, selection.toUpperCase(), descW)
        : [];
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const bodyLines = description ? wrapText(doc, description, descW) : ['—'];

      const selBlockH = selLines.length * selLineH;
      const bodyBlockH = Math.max(bodyLines.length, 1) * lineH;
      // Full row box: padding + selection + body (baseline steps) + padding
      const rowH = rowPadY + selBlockH + bodyBlockH + rowPadY;

      // Keep row together; re-draw table header after page break
      if (y + rowH > contentBottom) {
        drawFooter();
        doc.addPage();
        pageNum += 1;
        y = margin;
        drawTableHeader();
      }

      const rowTop = y;
      const rowBottom = rowTop + rowH;
      // First text baseline sits inside top padding (jsPDF y = baseline)
      const firstBaseline = rowTop + rowPadY + 9;
      let textY = firstBaseline;

      if (selLines.length) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...accent);
        selLines.forEach((line) => {
          doc.text(line, col.desc, textY);
          textY += selLineH;
        });
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...ink);
      bodyLines.forEach((line) => {
        doc.text(line, col.desc, textY);
        textY += lineH;
      });

      // Vertically center qty/unit/amount within the full row box
      const numBaseline = rowTop + rowH / 2 + 3;
      const qtyStr =
        item.quantity == null || item.quantity === ''
          ? ''
          : String(item.quantity);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...ink);
      doc.text(qtyStr, col.qty, numBaseline, { align: 'right' });
      doc.text(money(item.unit_price_cents, currency), col.unit, numBaseline, {
        align: 'right'
      });
      doc.text(money(amount, currency), col.amt, numBaseline, { align: 'right' });

      // Advance to absolute row bottom, then draw separator — never through text
      y = rowBottom;
      if (idx < items.length - 1) {
        doc.setDrawColor(...rowRule);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageW - margin, y);
        y += 8;
      }
    });

    if (!items.length) {
      ensureSpace(24);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...mute);
      doc.text('No line items.', margin, y);
      y += 18;
    }

    // —— Totals (labels + values share unit/amount column edges) ——
    y += 12;
    ensureSpace(78);
    doc.setDrawColor(...rule);
    doc.setLineWidth(0.6);
    doc.line(col.unit - unitW, y, pageW - margin, y);
    y += 18;

    function totalsRow(label, cents, { bold = false, size = 10 } = {}) {
      ensureSpace(18);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(size);
      doc.setTextColor(...(bold ? ink : soft));
      doc.text(label, col.unit, y, { align: 'right' });
      doc.text(money(cents, currency), col.amt, y, { align: 'right' });
      y += bold ? 18 : 15;
    }

    totalsRow('Subtotal', inv.subtotal_cents);
    totalsRow('Tax', inv.tax_cents);
    doc.setDrawColor(...ink);
    doc.setLineWidth(1);
    doc.line(col.unit - unitW, y - 4, pageW - margin, y - 4);
    y += 4;
    totalsRow('Total', inv.total_cents, { bold: true, size: 12 });
    y += 10;

    // —— Comments ——
    if (comments) {
      ensureSpace(40);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...mute);
      doc.text('COMMENTS / BILLING INFO', margin, y);
      y += 12;
      const commentLines = wrapText(doc, comments, contentW);
      y = drawWrappedLines(commentLines, margin, y, {
        fontSize: 10,
        color: soft,
        leading: lineH
      });
      y += 14;
    }

    // —— ACH ——
    if (hasAch(ach)) {
      const rows = achDetailRows(ach, { masked: false });
      ensureSpace(28 + rows.length * 16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...mute);
      doc.text('PAY BY ACH', margin, y);
      y += 10;
      doc.setDrawColor(...rule);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageW - margin, y);
      y += 14;

      const achLabelW = 110;
      rows.forEach(([label, value]) => {
        ensureSpace(16);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...mute);
        doc.text(String(label), margin, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...ink);
        doc.text(String(value), margin + achLabelW, y);
        y += 15;
      });
    }

    drawFooter();

    // Real file download (blob + <a download>), not print dialog
    try {
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch {
      // Fallback — jsPDF save() also downloads a file
      doc.save(filename);
    }
    return true;
  }

  global.AutoponicsInvoicePdf = {
    exportInvoicePdf,
    money,
    escapeHtml,
    parseDollarsToCents,
    centsToDollarsInput,
    parseDecimal,
    hasAch,
    achDetailRows,
    maskAccountNumber,
    maskRoutingNumber
  };
})(typeof window !== 'undefined' ? window : globalThis);
