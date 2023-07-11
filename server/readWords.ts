const fs = require('fs');

// Read words from file and save them in an array
export default function readWordsFromFile(filename:string): string[] {
  try {
    const data = fs.readFileSync(`server/${filename}`, 'utf-8');
    const words = data.split('\n');
    return words;
  } catch (err) {
    console.error('Error reading file:', err);
    return [];
  }
}
