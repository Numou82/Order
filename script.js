// Default items array started completely blank
let itemsData = [
  { desc: "", qty: "", unit: "" }
];

let canvas, ctx;
let isDrawing = false;

window.onload = function () {
  document.getElementById('invoiceDate').valueAsDate = new Date();

  // Automatic Invoice Number starting at 5000
  let lastInvNo = localStorage.getItem('lastInvoiceNo');
  if (!lastInvNo) {
    lastInvNo = 5000;
  } else {
    lastInvNo = parseInt(lastInvNo) + 1;
  }
  document.getElementById('invoiceNo').value = lastInvNo;

  renderRows();
  initSignaturePad();
};

/* --- Table & Calculations --- */

function renderRows() {
  const tbody = document.getElementById('itemsBody');
  tbody.innerHTML = '';

  // Render populated/starter rows
  itemsData.forEach((item, index) => {
    let row = `<tr>
      <td><input type="text" value="${item.desc}" id="desc_${index}" placeholder="Enter work description..."></td>
      <td><input type="number" value="${item.qty || ''}" id="qty_${index}" oninput="updateItem(${index})"></td>
      <td><input type="number" value="${item.unit || ''}" id="unit_${index}" oninput="updateItem(${index})"></td>
      <td id="total_${index}">0.000</td>
      <td class="no-print" style="text-align:center;"><button onclick="deleteRow(this)" class="btn-del">X</button></td>
    </tr>`;
    tbody.innerHTML += row;
  });

  // Render empty rows with delete buttons enabled
  for (let i = itemsData.length; i < 6; i++) {
    let emptyRow = `<tr>
      <td><input type="text" id="desc_${i}" placeholder="Enter description..."></td>
      <td><input type="number" id="qty_${i}" oninput="updateItem(${i})"></td>
      <td><input type="number" id="unit_${i}" oninput="updateItem(${i})"></td>
      <td id="total_${i}">0.000</td>
      <td class="no-print" style="text-align:center;"><button onclick="deleteRow(this)" class="btn-del">X</button></td>
    </tr>`;
    tbody.innerHTML += emptyRow;
  }

  calculateTotals();
}

function updateItem(index) {
  let row = document.querySelectorAll('#itemsBody tr')[index];
  if (!row) return;

  let qty = parseFloat(row.querySelectorAll('input[type="number"]')[0]?.value) || 0;
  let unit = parseFloat(row.querySelectorAll('input[type="number"]')[1]?.value) || 0;
  let total = qty * unit;

  let totalCell = row.querySelector('td:nth-child(4)');
  if (totalCell) {
    totalCell.innerText = total.toFixed(3);
  }

  calculateTotals();
}

function addNewRow() {
  const tbody = document.getElementById('itemsBody');
  let newIndex = tbody.querySelectorAll('tr').length;
  let row = `<tr>
    <td><input type="text" id="desc_${newIndex}" placeholder="Enter work description..."></td>
    <td><input type="number" id="qty_${newIndex}" oninput="updateItem(${newIndex})"></td>
    <td><input type="number" id="unit_${newIndex}" oninput="updateItem(${newIndex})"></td>
    <td id="total_${newIndex}">0.000</td>
    <td class="no-print" style="text-align:center;"><button onclick="deleteRow(this)" class="btn-del">X</button></td>
  </tr>`;
  tbody.innerHTML += row;
  calculateTotals();
}

function deleteRow(btn) {
  let row = btn.closest('tr');
  row.remove();
  calculateTotals();
}

function removeEmptyRowsBeforePrint() {
  const rows = document.querySelectorAll('#itemsBody tr');
  rows.forEach((row) => {
    let desc = row.querySelector('input[type="text"]')?.value.trim();
    let qty = row.querySelectorAll('input[type="number"]')[0]?.value;
    let unit = row.querySelectorAll('input[type="number"]')[1]?.value;

    if (!desc && !qty && !unit) {
      row.remove();
    }
  });
  calculateTotals();
}

function calculateTotals() {
  let subtotal = 0;
  const rows = document.querySelectorAll('#itemsBody tr');

  rows.forEach((row) => {
    let inputs = row.querySelectorAll('input[type="number"]');
    let qty = parseFloat(inputs[0]?.value) || 0;
    let unit = parseFloat(inputs[1]?.value) || 0;
    let total = qty * unit;

    let cell = row.querySelector('td:nth-child(4)');
    if (cell) cell.innerText = total.toFixed(3);

    subtotal += total;
  });

  document.getElementById('subtotal').innerText = subtotal.toFixed(3);

  let discount = parseFloat(document.getElementById('discount').value) || 0;
  let handling = parseFloat(document.getElementById('handling').value) || 0;
  let installation = parseFloat(document.getElementById('installation').value) || 0;

  let grandTotal = subtotal - discount + handling + installation;
  document.getElementById('totalAmount').innerText = "KWD " + grandTotal.toFixed(3);
}

/* --- Touch & Mouse Signature Pad Logic --- */

function initSignaturePad() {
  canvas = document.getElementById('sigCanvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;

  canvas.addEventListener('touchstart', startDraw);
  canvas.addEventListener('touchmove', draw);
  canvas.addEventListener('touchend', stopDraw);

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDraw);
}

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  if (e.touches && e.touches[0]) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  }
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

function startDraw(e) {
  isDrawing = true;
  const pos = getPos(e);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  e.preventDefault();
}

function draw(e) {
  if (!isDrawing) return;
  const pos = getPos(e);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
  e.preventDefault();
}

function stopDraw() {
  isDrawing = false;
}

function clearSignature() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  document.getElementById('sigCanvas').style.display = 'block';
  document.getElementById('sigImage').style.display = 'none';
}

/* --- Save & PDF Generation --- */

function saveAndDownloadPDF() {
  const invoiceNo = document.getElementById('invoiceNo').value;
  const date = document.getElementById('invoiceDate').value;
  const clientName = document.getElementById('contactName').value;
  const mobile = document.getElementById('clientPhone').value;
  const grandTotal = document.getElementById('totalAmount').innerText;

  if (!clientName) {
    alert("Please enter Customer Name");
    return;
  }

  removeEmptyRowsBeforePrint();

  const dataURL = canvas.toDataURL();
  const sigImg = document.getElementById('sigImage');
  sigImg.src = dataURL;
  sigImg.style.display = 'block';
  canvas.style.display = 'none';

  let statement = JSON.parse(localStorage.getItem('invoiceStatement')) || [];
  statement.push({
    "Date": date,
    "Invoice No": invoiceNo,
    "Customer Name": clientName,
    "Mobile No": mobile,
    "Total Amount": grandTotal
  });
  localStorage.setItem('invoiceStatement', JSON.stringify(statement));

  localStorage.setItem('lastInvoiceNo', invoiceNo);

  setTimeout(() => {
    window.print();
  }, 200);
}

function exportStatement() {
  let statement = JSON.parse(localStorage.getItem('invoiceStatement')) || [];

  if (statement.length === 0) {
    alert("No records found in statement!");
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(statement);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Statement of Account");

  XLSX.writeFile(workbook, "Statement_of_Account.xlsx");
}

function resetForm() {
  location.reload();
}
