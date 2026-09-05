// Document Initialization
document.addEventListener('DOMContentLoaded', () => {
  setDefaultDate();
  generateInvoiceNumber();
  addNewRow(); // Add initial item row
  initSignatureCanvas();
});

// Set default date to today
function setDefaultDate() {
  const dateInput = document.getElementById('invoiceDate');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
  }
}

// Generate Invoice / Quotation Number
function generateInvoiceNumber() {
  const invInput = document.getElementById('invoiceNo');
  if (invInput && !invInput.value) {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    invInput.value = randomNum;
  }
}

// Toggle between Invoice and Quotation Mode
function toggleDocType() {
  const title = document.getElementById('docTitle');
  const label = document.getElementById('numberLabel');
  const btn = document.getElementById('docTypeBtn');

  if (title.innerText === 'INVOICE') {
    title.innerText = 'QUOTATION';
    label.innerText = 'Quotation NO.:';
    btn.innerText = 'Switch to Invoice';
    btn.style.background = '#0d6efd';
  } else {
    title.innerText = 'INVOICE';
    label.innerText = 'Invoice NO.:';
    btn.innerText = 'Switch to Quotation';
    btn.style.background = '#6f42c1';
  }
}

// Add New Row to Items Table
function addNewRow() {
  const tbody = document.getElementById('itemsBody');
  const tr = document.createElement('tr');

  tr.innerHTML = `
    <td><input type="text" placeholder="Item description" class="item-desc"></td>
    <td><input type="number" value="1" min="1" class="item-qty" oninput="calculateTotals()"></td>
    <td><input type="number" value="0.000" step="0.001" class="item-price" oninput="calculateTotals()"></td>
    <td><span class="item-total">0.000</span></td>
    <td class="no-print" style="text-align: center;"><button class="btn-del" onclick="removeRow(this)">✕</button></td>
  `;

  tbody.appendChild(tr);
  calculateTotals();
}

// Remove Row from Items Table
function removeRow(btn) {
  const row = btn.closest('tr');
  const tbody = document.getElementById('itemsBody');
  if (tbody.children.length > 1) {
    row.remove();
    calculateTotals();
  } else {
    alert('At least one item row is required.');
  }
}

// Calculate Totals Real-Time
function calculateTotals() {
  const rows = document.querySelectorAll('#itemsBody tr');
  let subtotal = 0;

  rows.forEach(row => {
    const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    const total = qty * price;
    
    row.querySelector('.item-total').innerText = total.toFixed(3);
    subtotal += total;
  });

  const discount = parseFloat(document.getElementById('discount').value) || 0;
  const handling = parseFloat(document.getElementById('handling').value) || 0;
  const installation = parseFloat(document.getElementById('installation').value) || 0;

  const grandTotal = subtotal - discount + handling + installation;

  document.getElementById('subtotal').innerText = subtotal.toFixed(3);
  document.getElementById('totalAmount').innerText = 'KWD ' + grandTotal.toFixed(3);
}

// Signature Canvas Engine (Supports Touch & Mouse)
let canvas, ctx, isDrawing = false;

function initSignatureCanvas() {
  canvas = document.getElementById('sigCanvas');
  if (!canvas) return;

  ctx = canvas.getContext('2d');
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  // Mouse Events
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseleave', stopDrawing);

  // Touch Events for Mobile / Android APK
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    const mouseEvent = new MouseEvent('mouseup', {});
    canvas.dispatchEvent(mouseEvent);
  });
}

function startDrawing(e) {
  isDrawing = true;
  const rect = canvas.getBoundingClientRect();
  ctx.beginPath();
  ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function draw(e) {
  if (!isDrawing) return;
  const rect = canvas.getBoundingClientRect();
  ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
  ctx.stroke();
}

function stopDrawing() {
  isDrawing = false;
}

function clearSignature() {
  if (canvas && ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

// Universal PDF Generator & Save (Mobile & Desktop Compatible)
function saveAndDownloadPDF() {
  const canvasEl = document.getElementById('sigCanvas');
  const imgEl = document.getElementById('sigImage');

  // Sync canvas to image for reliable PDF printing
  if (canvasEl && imgEl) {
    imgEl.src = canvasEl.toDataURL();
    imgEl.style.display = 'block';
    canvasEl.style.display = 'none';
  }

  // Native Median.co Mobile Integration
  if (window.median && window.median.print) {
    window.median.print.print();
    restoreCanvas();
    return;
  }

  // Detect Mobile Device / WebView
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile && typeof html2pdf !== 'undefined') {
    const element = document.getElementById('invoice');
    const docNo = document.getElementById('invoiceNo').value || 'Doc';
    const docType = document.getElementById('docTitle').innerText;

    const opt = {
      margin:       [4, 4, 4, 4],
      filename:     `${docType}_${docNo}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      restoreCanvas();
    }).catch(err => {
      console.error('Mobile PDF Error:', err);
      window.print();
      restoreCanvas();
    });
  } else {
    // Desktop Standard Print / Save
    window.print();
    setTimeout(restoreCanvas, 1000);
  }
}

function restoreCanvas() {
  const canvasEl = document.getElementById('sigCanvas');
  const imgEl = document.getElementById('sigImage');
  if (canvasEl && imgEl) {
    canvasEl.style.display = 'block';
    imgEl.style.display = 'none';
  }
}

// Reset Document for New Entry
function resetForm() {
  if (confirm('Are you sure you want to clear and start a new document?')) {
    document.getElementById('contactName').value = '';
    document.getElementById('clientAddress').value = '';
    document.getElementById('clientPhone').value = '';
    document.getElementById('advancePaid').value = '';
    document.getElementById('discount').value = '0';
    document.getElementById('handling').value = '0';
    document.getElementById('installation').value = '0';
    
    document.getElementById('itemsBody').innerHTML = '';
    
    generateInvoiceNumber();
    setDefaultDate();
    addNewRow();
    clearSignature();
  }
}

// Excel Export function using SheetJS library
function exportStatement() {
  const customerName = document.getElementById('contactName').value || 'Customer';
  const docType = document.getElementById('docTitle').innerText;
  const docNo = document.getElementById('invoiceNo').value;
  const docDate = document.getElementById('invoiceDate').value;
  const grandTotal = document.getElementById('totalAmount').innerText;

  const data = [
    ["SAIF CENTRALAC AIR CONDITIONER"],
    ["Document Type", docType],
    ["Document NO.", docNo],
    ["Date", docDate],
    ["Customer Name", customerName],
    ["Contact No", document.getElementById('clientPhone').value],
    ["Address", document.getElementById('clientAddress').value],
    [],
    ["Description", "Quantity", "Per Unit (KWD)", "Total (KWD)"]
  ];

  const rows = document.querySelectorAll('#itemsBody tr');
  rows.forEach(row => {
    const desc = row.querySelector('.item-desc').value;
    const qty = row.querySelector('.item-qty').value;
    const price = row.querySelector('.item-price').value;
    const total = row.querySelector('.item-total').innerText;
    data.push([desc, qty, price, total]);
  });

  data.push([]);
  data.push(["Subtotal", "", "", document.getElementById('subtotal').innerText]);
  data.push(["Discount", "", "", document.getElementById('discount').value]);
  data.push(["Handling/Lifting", "", "", document.getElementById('handling').value]);
  data.push(["Installation", "", "", document.getElementById('installation').value]);
  data.push(["Grand Total", "", "", grandTotal]);

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Statement");

  XLSX.writeFile(wb, `${docType}_${docNo}_Statement.xlsx`);
}
