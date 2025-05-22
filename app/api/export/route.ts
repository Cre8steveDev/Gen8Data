import { type NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"

export async function POST(request: NextRequest) {
  try {
    const { data, format, filename = "dataset" } = await request.json()

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 })
    }

    if (format === "csv") {
      return exportCsv(data, filename)
    } else if (format === "xlsx") {
      return exportXlsx(data, filename)
    } else {
      return NextResponse.json({ error: "Unsupported format" }, { status: 400 })
    }
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 })
  }
}

function exportCsv(data: any[], filename: string) {
  // Convert data to CSV
  const worksheet = XLSX.utils.json_to_sheet(data)
  const csv = XLSX.utils.sheet_to_csv(worksheet)

  // Create response with CSV data
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
    },
  })
}

function exportXlsx(data: any[], filename: string) {
  // Create workbook and add worksheet
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(data)
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data")

  // Write to buffer
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

  // Create response with Excel data
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
    },
  })
}
