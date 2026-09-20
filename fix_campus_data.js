import fs from 'fs';

let fileContent = fs.readFileSync('data/campusData.ts', 'utf8');

const lectureTheatres = [
  'Amphi Theatre',
  'FirstBank Lecture Theatre',
  'ACE',
  'Pit Theatre',
  'Alex Duduyemi Lecture Theater',
  'Ajose Lecture Theatre',
  'Chemical Engineering Lecture Theatre',
  'BOO Lecture Theatres (BOOA/B/C)'
];

let updatedContent = fileContent.replace(/name:\s*"([^"]+)"[\s\S]*?type:\s*"([^"]+)"/g, (match, name, type) => {
  let newType = type;
  
  if (lectureTheatres.includes(name)) {
    newType = 'lecture rooms';
  } else if (type === 'residential') {
    newType = 'hostel';
  } else if (type === 'transport' || type === 'sports' || type === 'health') {
    newType = 'facility';
  }
  
  if (newType !== type) {
    return match.replace(`type: "${type}"`, `type: "${newType}"`);
  }
  return match;
});

fs.writeFileSync('data/campusData.ts', updatedContent, 'utf8');
console.log('Fixed campusData.ts types');
