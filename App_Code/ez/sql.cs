///1.16.1124@資料庫模組

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Collections;
using System.Data;
using System.Data.OleDb;
using System.Configuration;
using System.Web.UI.WebControls;

/// <summary>
/// 資料庫核心
/// </summary>

namespace ez
{

    public class sql
    {

        public string log = "";
        public string db = ConfigurationManager.ConnectionStrings["shopConn"].ConnectionString;       
        public string p_name = ConfigurationManager.ConnectionStrings["shopConn"].ProviderName;
            
        public bool dbIsSql() //判斷SQL或Access資料庫        
        {
            return (p_name == "System.Data.SqlClient" ? true : false);        
        }

        public string mark(string column)
        {
            column = column.Replace("[", "");
            column = column.Replace("]", "");
            string value = null;
            string[] c = column.Split(',');
            for (int i = 0; i <= c.Length - 1; i++)
            {
                value += (value != null ? "," : "") + "?";
            }
            return value;
        }

        public string mark2(string column)
        {
            column = column.Replace("[", "");
            column = column.Replace("]", "");
            string value = null;
            string[] c = column.Split(',');
            for (int i = 0; i <= c.Length - 1; i++)
            {
                value += (value != null ? "," : "") + "[" + c[i] + "]=?";
            }
            return value;
        }

        public string sqlColumns(string column, string tableName, int num)
        {
            string columnValue = "";
            DataTable dt = selectTable("select [" + column + "] from [" + tableName + "] where num=" + num.ToString());
            if (dt.Rows.Count > 0) { columnValue = dt.Rows[0][column].ToString(); }
            return columnValue;
        }

        public DataTable dataTable(OleDbCommand sqlCmd)
        {
            System.Data.DataTable sqlTable = new System.Data.DataTable();
            OleDbDataAdapter sqlAdapter = new OleDbDataAdapter(sqlCmd);
            sqlAdapter.Fill(sqlTable);
            sqlAdapter.Dispose();
            return sqlTable;
        }

        public bool execute(string sqlCommand)
        {
            return execute(sqlCommand, null);
        }

        public bool execute(string sqlCommand, ArrayList OleDbParameters)
        {           
            log = "";
            bool success = true;

            OleDbConnection sqlConn = new OleDbConnection((dbIsSql() ? "Provider=SQLOLEDB;" : "") + db);
            try
            {
                sqlConn.Open();
                OleDbCommand sqlCmd = new OleDbCommand("", sqlConn);
                sqlCmd.CommandText = sqlCommand;
                if (OleDbParameters != null)
                {
                    if (OleDbParameters.Count > 0)
                    {
                        foreach (OleDbParameter Parameter in OleDbParameters)
                        {
                            sqlCmd.Parameters.Add(new OleDbParameter(Parameter.ParameterName, Parameter.Value));
                        }
                    }
                }
                sqlCmd.ExecuteNonQuery();
            }
            catch (Exception ex)
            {
                log = "ez.sql.execute:" + ex.Message;
                success = false;
            }
            finally
            {
                sqlConn.Close();
                sqlConn.Dispose();
            }

            return success;
        }

        public bool executeIf(string SelectCommand, ArrayList SelectParameters, string InsertCommand, ArrayList InsertParameters, string UpdateCommand, ArrayList UpdateParameters)
        {
            log = "";
            bool success = true;

            OleDbConnection sqlConn = new OleDbConnection((dbIsSql() ? "Provider=SQLOLEDB;" : "") + db);
            try
            {
                sqlConn.Open();
                OleDbCommand sqlCmd = new OleDbCommand("", sqlConn);
                sqlCmd.CommandText = SelectCommand;
                if (SelectParameters != null)
                {
                    if (SelectParameters.Count > 0)
                    {
                        foreach (OleDbParameter Parameter in SelectParameters)
                        {
                            sqlCmd.Parameters.Add(new OleDbParameter(Parameter.ParameterName, Parameter.Value));
                        }
                    }
                }
                OleDbDataAdapter sqlAdapter = new OleDbDataAdapter(sqlCmd);
                DataTable dt = new DataTable();
                sqlAdapter.Fill(dt);
                if (dt.Rows.Count > 0)
                {
                    sqlCmd = new OleDbCommand("", sqlConn);
                    sqlCmd.CommandText = UpdateCommand;
                    if (UpdateParameters != null)
                    {
                        if (UpdateParameters.Count > 0)
                        {
                            foreach (OleDbParameter Parameter in UpdateParameters)
                            {
                                sqlCmd.Parameters.Add(new OleDbParameter(Parameter.ParameterName, Parameter.Value));
                            }
                        }
                    }
                    sqlCmd.ExecuteNonQuery();
                }
                else
                {
                    sqlCmd = new OleDbCommand("", sqlConn);
                    sqlCmd.CommandText = InsertCommand;
                    if (InsertParameters != null)
                    {
                        if (InsertParameters.Count > 0)
                        {
                            foreach (OleDbParameter Parameter in InsertParameters)
                            {
                                sqlCmd.Parameters.Add(new OleDbParameter(Parameter.ParameterName, Parameter.Value));
                            }
                        }
                    }
                    sqlCmd.ExecuteNonQuery();
                }
             
            }
            catch (Exception ex)
            {
                log = "ez.sql.execute:" + ex.Message;
                //HttpContext.Current.Response.Write(log);
                success = false;
            }
            finally
            {
                sqlConn.Close();
                sqlConn.Dispose();
            }

            return success;
        }

        public DataTable selectTable(string sqlCommand) 
        {
            DataTable sqlTable = selectTable(sqlCommand, null);
            return sqlTable;
        }

        public DataTable selectTable(string sqlCommand, ArrayList OleDbParameters)
        {

            log = "";
            DataTable sqlTable = new DataTable();
            OleDbConnection sqlConn = new OleDbConnection((dbIsSql() ? "Provider=SQLOLEDB;" : "") + db);
            int sqlTableRow = 0;
            try
            {
                sqlConn.Open();
                OleDbCommand sqlCmd = new OleDbCommand("", sqlConn);
                sqlCmd.CommandText = sqlCommand;
                if (OleDbParameters != null)
                {
                    if (OleDbParameters.Count > 0)
                    {
                        foreach (OleDbParameter Parameter in OleDbParameters)
                        {
                            sqlCmd.Parameters.Add(new OleDbParameter(Parameter.ParameterName, Parameter.Value));
                        }
                    }
                }              
                OleDbDataAdapter sqlAdapter = new OleDbDataAdapter(sqlCmd);               
                sqlAdapter.Fill(sqlTable);
                sqlTableRow = sqlTable.Rows.Count;
            }
            catch (Exception ex)
            {
                log = "ez.sql.selectTable:" + ex.Message;
            }
            finally
            {
                sqlConn.Close();
                sqlConn.Dispose();
            }
            return sqlTable;

        }


        public class pageData : ez.function
        {
            public string column;
            public string table;
            public string query;
            public string queryJoinTable;
            public string queryGroup;
            public string sort;
            public int total;
            public int? pageSize;
            public int? nowPage;
            public int? maxPage;
            public int? prePage;
            public int? nextPage;
            public ArrayList parameters;
            public DataTable sqlDataPage;
            public PagedDataSource accessDataPage;
            public string log;
            
            public bool load(){

                bool success = true;

                sql sql = new sql();
                DataTable dt;

                log = "";
                total = 0;
                if (isStrNull(column)) { column = "*"; }
                if (!pageSize.HasValue) { pageSize = defautPageSize; }
                if (!nowPage.HasValue) { nowPage = 1; }
                if (!prePage.HasValue) { prePage = 1; }
                if (!nextPage.HasValue) { nextPage = 1; }
                if (!maxPage.HasValue) { maxPage = 1; }
               
                if (sql.dbIsSql())  //SQL
                {              
                    string sqlQuery = "select " + column + " from [" + table + "]";
                    if (!isStrNull(queryJoinTable)) { sqlQuery += queryJoinTable; }
                    if (!isStrNull(query))    { sqlQuery += " where " + query;    }                 
                    if (!isStrNull(queryGroup)) { sqlQuery += " group by " + queryGroup; }
                    sqlQuery = "select count(*) as [rowTotal] from (" + sqlQuery + ") as countTableTemp";
                    dt = sql.selectTable(sqlQuery, parameters);
                   
                    log = sql.log ;
                    if (isStrNull(log))
                    {
                        if (dt.Rows.Count > 0)
                        {
                            if (!isStrNull(dt.Rows[0]["rowTotal"])) { total = Val(dt.Rows[0]["rowTotal"]); }
                            if (total > 0)
                            {
                                maxPage = total / pageSize + (total % pageSize > 0 ? 1 : 0);
                                if (nowPage > maxPage) { nowPage = maxPage; }
                                prePage = (nowPage - 1 >= 1 ? nowPage - 1 : 1);
                                nextPage = (nowPage + 1 <= maxPage ? nowPage + 1 : maxPage);

                                int startIndex = Val((nowPage - 1) * pageSize + 1);
                                int endIndex =  Val(startIndex + pageSize - 1);

                                sqlQuery = "select " + column;
                                if (!isStrNull(sort)) { sqlQuery += ",ROW_NUMBER() OVER(ORDER BY " + sort + ") AS ROWID"; }
                                else { sqlQuery += ",ROW_NUMBER() OVER(ORDER BY " + (!isStrNull(queryJoinTable) ? "[" + table + "]." : "") + "num) AS ROWID"; }
                                sqlQuery += " from [" + table + "]";
                                if (!isStrNull(queryJoinTable)) { sqlQuery += queryJoinTable; }                          
                                if (!isStrNull(query)) { sqlQuery += " where " + query; }
                                if (!isStrNull(queryGroup)) { sqlQuery += " group by " + queryGroup; }
                                sqlQuery = "select * from (" + sqlQuery + ") as queryTable  where queryTable.ROWID between " + startIndex.ToString() + " and " + endIndex.ToString();
                              
                                if (!isStrNull(query))
                                {
                                    sqlDataPage = sql.selectTable(sqlQuery, parameters);
                                }
                                else
                                {
                                    sqlDataPage = sql.selectTable(sqlQuery);
                                }                
                                log = sql.log;
                             
                            }
                        }
                    }
                    else
                    {
                        success = false;
                    }
                }
                else  //ACCESS
                {
                    sqlDataPage = new DataTable();
                    DataTable accessDt;
                    string sqlQuery = "select " + column + " from [" + table + "]";
                    if (!isStrNull(queryJoinTable)) { sqlQuery += queryJoinTable; }               
                    if (!isStrNull(query)) { sqlQuery += " where " + query; }
                    if (!isStrNull(queryGroup)) { sqlQuery += " group by " + queryGroup; }
                    if (!isStrNull(sort)) { sqlQuery += " order by " + sort; }
                    if (!isStrNull(query))
                    {
                        accessDt = sql.selectTable(sqlQuery, parameters);
                    }
                    else
                    {
                        accessDt = sql.selectTable(sqlQuery);
                    }
                    log = sql.log;
                    if (isStrNull(log))
                    {
                        accessDataPage = new PagedDataSource();
                        accessDataPage.DataSource = accessDt.DefaultView;                       
                        accessDataPage.AllowPaging = true;
                        accessDataPage.PageSize = Val(pageSize);
                        maxPage = accessDataPage.PageCount;
                        total = accessDt.Rows.Count;
                        if (nowPage > maxPage) { nowPage = maxPage; }
                        prePage = (nowPage - 1 >= 1 ? nowPage - 1 : 1);
                        nextPage = (nowPage + 1 <= maxPage ? nowPage + 1 : maxPage);
                        accessDataPage.CurrentPageIndex = Val(nowPage) - 1;

                        for (int i = 0; i < accessDt.Columns.Count; i++)
                        {
                            sqlDataPage.Columns.Add(accessDt.Columns[i].ColumnName, accessDt.Columns[i].DataType);
                        }

                        if (accessDt.Rows.Count > 0)
                        {
                            int Index1 = accessDataPage.FirstIndexInPage;
                            int Index2 = Index1 + accessDataPage.PageSize - 1;
                            if (Index2 > accessDt.Rows.Count - 1) { Index2 = accessDt.Rows.Count - 1; }
                            for (int r = Index1; r <= Index2; r++)
                            {
                                DataRow tr = sqlDataPage.NewRow();
                                for (int i = 0; i < accessDt.Columns.Count; i++)
                                {
                                    tr[accessDt.Columns[i].ColumnName] = accessDt.Rows[r][accessDt.Columns[i].ColumnName];
                                }
                                sqlDataPage.Rows.Add(tr);
                            }

                        }                                             

                    }
                }

                if (!isStrNull(log))
                {
                    success = false;                   
                }

                return success;
            }
                       

        }


    }

       

}

