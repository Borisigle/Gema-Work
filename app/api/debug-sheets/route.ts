import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;

  const diagnostics: any = {
    env_check: {
      GOOGLE_SHEET_ID_presente: !!sheetId,
      GOOGLE_SHEET_ID_largo: sheetId?.length || 0,
      GOOGLE_SERVICE_ACCOUNT_EMAIL_presente: !!email,
      GOOGLE_SERVICE_ACCOUNT_EMAIL_valor: email || 'FALTA',
      GOOGLE_PRIVATE_KEY_presente: !!rawKey,
      GOOGLE_PRIVATE_KEY_largo: rawKey?.length || 0,
      GOOGLE_PRIVATE_KEY_empieza_con: rawKey?.substring(0, 30) || 'FALTA',
      GOOGLE_PRIVATE_KEY_tiene_saltos_reales: rawKey?.includes('\n') || false,
      GOOGLE_PRIVATE_KEY_tiene_barras_n: rawKey?.includes('\\n') || false,
    },
  };

  if (!sheetId || !email || !rawKey) {
    return NextResponse.json({ ...diagnostics, resultado: 'FALTAN VARIABLES DE ENTORNO' });
  }

  try {
    const privateKey = rawKey.replace(/\\n/g, '\n');
    const auth = new google.auth.JWT(email, undefined, privateKey, [
      'https://www.googleapis.com/auth/spreadsheets',
    ]);

    const sheets = google.sheets({ version: 'v4', auth });

    const start = Date.now();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'students!A:D',
    });
    const elapsed = Date.now() - start;

    return NextResponse.json({
      ...diagnostics,
      resultado: 'CONEXION OK',
      tiempo_ms: elapsed,
      filas_leidas: res.data.values?.length || 0,
      primeras_filas: res.data.values?.slice(0, 5) || [],
    });
  } catch (err: any) {
    return NextResponse.json({
      ...diagnostics,
      resultado: 'ERROR DE CONEXION',
      error_message: err.message,
      error_code: err.code,
      error_status: err.response?.status,
      error_data: err.response?.data,
    });
  }
}
