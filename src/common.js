export function formatAmount(amount = 0, showSymbol, unit = '￥', fixed = 2) {
  let symbol = '';
  if (amount > 0) {
    symbol = '+';
  } else {
    symbol = '-';
  }
  symbol = showSymbol ? symbol : '';
  let formated = Number(Math.abs(amount)).toFixed(fixed);
  return `${symbol}${unit + formated}`;
}

function mergeCSVParsingCell(headers, cell, index) {
  let data = {};
  headers.forEach((header, index) => {
    data[header] = cell[index];
  });
  if (index) data.id = index;
  return data;
}

// csv 读取类别的数据格式 [["type", "time", "category", "amount"],["0", "1561910400000", "8s0p77c323", "5400"]]
export function transferCSVParsingResultToArray(results = {}) {
  const { data = [], errors = [] } = results;
  if (errors.length == 0) {
    const headers = data[0];
    const cells = data.slice(1);
    const rows = [];
    cells.forEach((cell, index) => {
      rows.push(mergeCSVParsingCell(headers, cell, index + 1));
    });
    return rows;
  } else {
    return [];
  }
}

export function transferCSVParsingResultToMap(results = {}, key = 0) {
  const { data = [], errors = [] } = results;
  if (errors.length == 0) {
    const headers = data[0];
    const cells = data.slice(1);
    const rows = {};
    cells.forEach(cell => {
      rows[cell[key]] = mergeCSVParsingCell(headers, cell);
    });
    return rows;
  } else {
    return [];
  }
}
