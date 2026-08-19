import { getQuery, runQuery } from "./dbUtils.js"

export const selectSettings = () => {
  return getQuery(`SELECT * FROM app_settings WHERE id = 1`, [])
}

export const updateSettingsRow = (settings) => {
  return runQuery(
    `UPDATE app_settings
     SET shop_name = ?,
         shop_address = ?,
         shop_phone = ?,
         shop_email = ?,
         logo_path = ?,
         currency_symbol = ?,
         tax_rate = ?,
         theme_preset = ?,
         theme_colors = ?,
         updated_at = datetime('now')
     WHERE id = 1`,
    [
      settings.shop_name,
      settings.shop_address,
      settings.shop_phone,
      settings.shop_email,
      settings.logo_path,
      settings.currency_symbol,
      settings.tax_rate,
      settings.theme_preset,
      settings.theme_colors,
    ],
  )
}
