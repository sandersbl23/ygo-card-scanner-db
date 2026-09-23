import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

function toCsv(cards) {
  const headers = ['name', 'type', 'rarity', 'set_code', 'quantity', 'location'];
  const escape = (value) => {
    const str = value == null ? '' : String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const lines = [headers.join(',')];
  for (const card of cards) {
    lines.push(headers.map((h) => escape(card[h])).join(','));
  }
  return lines.join('\n');
}

export async function exportCollection(cards, format = 'csv') {
  const isCsv = format === 'csv';
  const content = isCsv ? toCsv(cards) : JSON.stringify(cards, null, 2);
  const fileUri = `${FileSystem.cacheDirectory}card-collection.${isCsv ? 'csv' : 'json'}`;

  await FileSystem.writeAsStringAsync(fileUri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: isCsv ? 'text/csv' : 'application/json',
      dialogTitle: 'Export card collection',
    });
  }

  return fileUri;
}
