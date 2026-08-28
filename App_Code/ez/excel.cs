///1.20.1127@excel模組

using OfficeOpenXml;
using OfficeOpenXml.Style;
using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Web;

/// <summary>
/// excel核心
/// </summary>

namespace ez
{

    public class excel
    {
        public string FileName;
        public string Author;
        public string ExcelTitle;
        public string SheetName;
        public string FullPath;
        public List<string> ColumnTitle;
        public DataTable QueryView;
        public string log;

        public bool export()
        {
            bool success = true;
            log = "";

            if (!string.IsNullOrEmpty(FileName) && ColumnTitle.Count > 0 && QueryView.Rows.Count > 0)
            {
                using (ExcelPackage package = new ExcelPackage())
                {
                    package.Workbook.Properties.Author = (!string.IsNullOrEmpty(Author) ? Author : "EZtrust");
                    package.Workbook.Properties.Title = (!string.IsNullOrEmpty(ExcelTitle) ? ExcelTitle : FileName);

                    package.Workbook.Worksheets.Add(FileName);
                    ExcelWorksheet worksheet = package.Workbook.Worksheets[1];
                    worksheet.Name = (!string.IsNullOrEmpty(SheetName) ? SheetName : FileName); //Setting Sheet's name
                    worksheet.Cells.Style.Font.Size = 11; //Default font size for whole sheet
                    worksheet.Cells.Style.Font.Name = "Calibri"; //Default Font name for whole sheet

                    //欄位名稱
                    int colIndex = 1;
                    int rowIndex = 1;
                    foreach (string ct in ColumnTitle)
                    {
                        var cell = worksheet.Cells[rowIndex, colIndex];
                        cell.Value = ct;
                        colIndex++;
                    }

                    //資料                        
                    foreach (DataRow item in QueryView.Rows)
                    {
                        colIndex = 1;
                        rowIndex++;
                        foreach (DataColumn dc in QueryView.Columns)
                        {
                            var cell = worksheet.Cells[rowIndex, colIndex];
                            cell.Value = item[dc.ColumnName];
                            if (colIndex >= ColumnTitle.Count()) { break; }
                            colIndex++;
                        }
                    }


                    //自動調整欄寬
                    worksheet.Cells.AutoFitColumns(0);
                    worksheet.Cells.Style.WrapText = true;
                    //自動調整欄寬
                    worksheet.Cells.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

                    package.Workbook.Properties.Title = "Attempts";
                    HttpContext.Current.Response.Clear();
                    HttpContext.Current.Response.AddHeader("content-disposition", "attachment; filename=" + FileName + (DateTime.Now.ToString("yyyy.MM.dd_HH-mm-ss")) + ".xlsx");
                    HttpContext.Current.Response.ContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                    HttpContext.Current.Response.BinaryWrite(package.GetAsByteArray());
                    HttpContext.Current.Response.End();
                }
            }
            else
            {
                success = false;
                log = "尚未指定要匯出的資料";
            }

            return success;
        }

        public bool import(bool isHeader = true)
        {
            bool success = true;
            log = "";
            QueryView = new DataTable();

            if (!string.IsNullOrEmpty(FullPath))
            {
                using (FileStream fs = new FileStream(FullPath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                {
                    using (ExcelPackage excelPkg = new ExcelPackage(fs))
                    {
                        ExcelWorksheet sheet = excelPkg.Workbook.Worksheets[1];//取得Sheet1

                        int startRowIndex = sheet.Dimension.Start.Row;//起始列
                        int endRowIndex = sheet.Dimension.End.Row;//結束列

                        int startColumn = sheet.Dimension.Start.Column;//開始欄
                        int endColumn = sheet.Dimension.End.Column;//結束欄

                        if (isHeader)//有包含標題
                        {
                            startRowIndex += 1;
                        }

                        // Create new Column in DataTable
                        for (int currentColumn = startColumn; currentColumn <= endColumn; currentColumn++)
                        {
                            QueryView.Columns.Add(currentColumn.ToString(), System.Type.GetType("System.String"));
                        }

                        // Create row for Data Table
                        for (int currentRow = startRowIndex; currentRow <= endRowIndex; currentRow++)
                        {
                            //抓出當前的資料範圍
                            ExcelRange range = sheet.Cells[currentRow, startColumn, currentRow, endColumn];

                            //全部儲存格是完全空白時則跳過
                            if (range.Any(c => !string.IsNullOrEmpty(c.Text)) == false)
                            {
                                continue; //略過此列
                            }

                            // Create row
                            DataRow Row = QueryView.NewRow();
                            for (int column = startColumn; column <= endColumn; column++)
                            {
                                Row[column.ToString()] = sheet.Cells[currentRow, column].Text;
                            }
                            QueryView.Rows.Add(Row);
                        }

                    }
                }
            }
            else
            {
                success = false;
                log = "尚未指定要匯入的檔案";
            }

            return success;
        }
    }



}

