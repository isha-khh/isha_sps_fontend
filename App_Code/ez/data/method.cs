///1.20.0107@頁面需知模組

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Collections;
using System.Data;
using System.Data.OleDb;
using System.Configuration;
using System.Web.UI;
using System.Web.UI.WebControls;

/// <summary>
/// method 的摘要描述
/// </summary>
public class method : ez.function
{

    ez.sql sql = new ez.sql();
    public string log;
    string _column;
    string _column2;
    string _nation;
    public string dbTableName = "other_words";   //資料表名稱

    public struct DataInfo
    {      
        public string word;
        public string status;//資料欄位是 _column+ status EXL(pro_words_status)
    }

	public method(string column, string nation, string column2 = "")  //建構函式
	{
        _column = column;
        _column2 = column2;
        _nation = nation;    
	}
    public DataInfo Data;

    public bool Load()
    {
        bool success = true;
        Data = new DataInfo();
        log = "";
        string sqlQuery = "select [" + _column + "] ";
        if (!isStrNull(_column2))
        {
            sqlQuery += ", [" + _column2 + "] ";
        }
        sqlQuery += " from [" + dbTableName + "] where nation=?";
        ArrayList OleDbParameters = new ArrayList();
        OleDbParameters.Add(new OleDbParameter("nation", _nation));
        DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);      
        log = sql.log;
        if (!isStrNull(log)) { 
            success = false;
        }
        else
        {
            if (dt.Rows.Count > 0)
            {          
                Data.word = dt.Rows[0][_column].ToString();
                if (!isStrNull(_column2))
                {
                    Data.status = dt.Rows[0][_column2].ToString();
                }
            }
            else
            {
                sqlQuery = "insert into  [" + dbTableName + "] (nation) values (?)";
                OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("nation", _nation));
                sql.execute(sqlQuery, OleDbParameters);
                Data.word = "";
            }
        }
        return success;
    }

    public bool Save()
    {
        log = "";

        string sqlQuery = "update [" + dbTableName + "] set [" + _column + "]=? ";
        if (!isStrNull(_column2))
        {
            sqlQuery += ", [" + _column2 + "]=? ";
        }
        sqlQuery += " where nation=?";
        ArrayList OleDbParameters = new ArrayList();
        OleDbParameters.Add(new OleDbParameter(_column, Data.word));
        if (!isStrNull(_column2))
        {
            OleDbParameters.Add(new OleDbParameter(_column2, Data.status));
        }
        OleDbParameters.Add(new OleDbParameter("nation", _nation));
        bool success = sql.execute(sqlQuery, OleDbParameters);
        if (!success) { log = sql.log; }
        return success;
    }

}