import React, { useRef } from 'react';
import { Platform } from 'react-native';
import { Button } from 'react-native-paper';

export function UniversalDocumentPicker({ onPick, loading }: { onPick: (file: File | Blob) => void, loading?: boolean }) {
  if (Platform.OS === 'web') {
    const inputRef = useRef<HTMLInputElement>(null);
    return (
      <>
        <Button
          mode="contained"
          onPress={() => inputRef.current?.click()}
          loading={loading}
          disabled={loading}
          style={{ margin: 16 }}
          icon="file-upload"
        >
          Importar Planilha (.csv)
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          disabled={loading}
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) onPick(file);
            e.target.value = '';
          }}
          style={{ display: 'none' }}
        />
      </>
    );
  }
  // Só importa DocumentPicker no mobile!
  const DocumentPicker = require('react-native-document-picker').default;
  return (
    <Button
      mode="contained"
      onPress={async () => {
        const res = await DocumentPicker.pickSingle({ type: [DocumentPicker.types.plainText] });
        if (res) onPick(res);
      }}
      loading={loading}
      disabled={loading}
      style={{ margin: 16 }}
      icon="file-upload"
    >
      Importar Planilha (.csv)
    </Button>
  );
} 