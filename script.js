let itemsData = [
  { desc: "Electric work with matreialmodel no60 (Machine provide by me)", qty: 1, unit: 1200 },
  { desc: "ducting work with matreial", qty: 0, unit: 0 },
  { desc: "copper work with commisining", qty: 0, unit: 0 }
];

window.onload = function () {
  // Set current date
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
};

function renderRows() {
  const tbody = document.getElementById('itemsBody');
  tbody.innerHTML = '';

  itemsData.forEach((item, index) => {
    let row = `<tr>
      <td><input type="text" value="${item.desc}" id="desc_${index}" oninput="updateItem(${index})"></td>
      <td><input type="number" value="${item.qty || ''}" id="qty_${index}" oninput="updateItem(${index})"></td>
      <td><input type="number" value="${item.unit || ''}" id="unit_${index}" oninput="updateItem(${index})"></td>
      <td id="total_${index}">0.000</td>
      <td class="no-print" style="text-align:center;"><button onclick="deleteRow(${index})" class="btn-del">X</button></td>
    </tr>`;
    tbody.innerHTML += row;
  });

  // Add empty default rows for aesthetics
  for (let i = itemsData.length; i < 8; i++) {
    let emptyRow = `<tr>
      <td><input type="text" placeholder="Enter description..." id="desc_${i}" oninput="updateItem(${i})"></td>
      <td><input type="number" id="qty_${i}" oninput="updateItem(${i})"></td>
      <td><input type="number" id="unit_${i}" oninput="updateItem(${i})"></td>
      <td id="total_${i}">0.000</td>
      <td class="no-print"></td>
    </tr>`;
    tbody.innerHTML += emptyRow;
  }

  calculateTotals();
}

function updateItem(index) {
  let qty = parseFloat(document.getElementById(`qty_${index}`)?.value) || 0;
  let unit = parseFloat(document.getElementById(`unit_${index}`)?.value) || 0;
  let total = qty * unit;

  let totalElem = document.getElementById(`total_${index}`);
  if (totalElem) {
    totalElem.innerText = total.toFixed(3);
  }

  calculateTotals();
}

function addNewRow() {
  itemsData.push({ desc: "", qty: "", unit: "" });
  renderRows();
}

function deleteRow(index) {
  itemsData.splice(index, 1);
  renderRows();
}

function calculateTotals() {
  let subtotal = 0;
  const rows = document.querySelectorAll('#itemsBody tr');

  rows.forEach((row, i) => {
    let qty = parseFloat(document.getElementById(`qty_${i}`)?.value) || 0;
    let unit = parseFloat(document.getElementById(`unit_${i}`)?.value) || 0;
    let total = qty * unit;

    let cell = document.getElementById(`total_${i}`);
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

function saveAndDownloadPDF() {
  const invoiceNo = document.getElementById('invoiceNo').value;
  const date = document.getElementById('invoiceDate').value;
  const clientName = document.getElementById('contactName').value || document.getElementById('clientCompany').value;
  const mobile = document.getElementById('clientPhone').value;
  const grandTotal = document.getElementById('totalAmount').innerText;

  if (!clientName) {
    alert("Please enter Contact Name or Client Company Name");
    return;
  }

  // 1. Save record into LocalStorage for Statement of Account
  let statement = JSON.parse(localStorage.getItem('invoiceStatement')) || [];
  statement.push({
    "Date": date,
    "Invoice No": invoiceNo,
    "Customer Name": clientName,
    "Mobile No": mobile,
    "Total Amount": grandTotal
  });
  localStorage.setItem('invoiceStatement', JSON.stringify(statement));

  // 2. Save current Invoice Number so next invoice increments from here
  localStorage.setItem('lastInvoiceNo', invoiceNo);

  // 3. Trigger native print to save as 1-Page PDF cleanly
  window.print();
}

function exportStatement() {
  let statement = JSON.parse(localStorage.getItem('invoiceStatement')) || [];

  if (statement.length === 0) {
    alert("No saved invoices found in statement!");
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
