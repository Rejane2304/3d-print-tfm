import fs from 'node:fs';

const filePath = '/Users/rejanerodrigues/MASTER/3d-print-tfm/src/app/(shop)/account/addresses/page.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// Reemplazar los labels sin htmlFor
content = content.replace(
  /<label className="block text-sm font-medium text-gray-700 mb-1">\s*Nombre de la dirección \*\s*<\/label>\s*<input/,
  '<label htmlFor="addressName" className="block text-sm font-medium text-gray-700 mb-1">' +
    'Nombre de la dirección *</label>\n' +
    '                  <input id="addressName"'
);

content = content.replace(
  /<label className="block text-sm font-medium text-gray-700 mb-1">\s*Destinatario \*\s*<\/label>\s*<input/,
  '<label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-1">' +
    'Destinatario *</label>\n' +
    '                    <input id="recipient"'
);

content = content.replace(
  /<label className="block text-sm font-medium text-gray-700 mb-1">\s*Teléfono \*\s*<\/label>\s*<input/,
  '<label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>\n' +
    '                    <input id="phone"'
);

content = content.replace(
  /<label className="block text-sm font-medium text-gray-700 mb-1">\s*Dirección \*\s*<\/label>\s*<input/,
  '<label htmlFor="addressLine" className="block text-sm font-medium text-gray-700 mb-1">' +
    'Dirección *</label>\n' +
    '                  <input id="addressLine"'
);

content = content.replace(
  /<label className="block text-sm font-medium text-gray-700 mb-1">\s*Complemento\s*<\/label>\s*<input/,
  '<label htmlFor="complement" className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>\n' +
    '                  <input id="complement"'
);

content = content.replace(
  /<label className="block text-sm font-medium text-gray-700 mb-1">\s*Código postal \*\s*<\/label>\s*<input/,
  '<label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">' +
    'Código postal *</label>\n' +
    '                    <input id="postalCode"'
);

content = content.replace(
  /<label className="block text-sm font-medium text-gray-700 mb-1">\s*Ciudad \*\s*<\/label>\s*<input/,
  '<label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">Ciudad *</label>\n' +
    '                    <input id="city"'
);

content = content.replace(
  /<label className="block text-sm font-medium text-gray-700 mb-1">\s*Provincia \*\s*<\/label>\s*<input/,
  '<label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">Provincia *</label>\n' +
    '                  <input id="province"'
);

content = content.replace(
  /<label className="block text-sm font-medium text-gray-700 mb-1">\s*País \*\s*<\/label>\s*<select/,
  '<label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">País *</label>\n' +
    '                  <select id="country"'
);

fs.writeFileSync(filePath, content);
console.log('Labels actualizados con htmlFor');
