///1.15.0216C@文案模組

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
/// webword 的摘要描述
/// </summary>
public class webword : ez.function
{

    ez.sql sql = new ez.sql();
    public string log;
    string _category;
    string _nation;
    public string dbTableName = "web_words";   //資料表名稱

    public struct DataInfo
    {
        public string subject;
        public string word;
        public bool status;
    }

    public webword(string category, string nation)  //建構函式
    {
        _category = category;
        _nation = nation;
    }
    public DataInfo Data;

    public bool Load()
    {
        bool success = true;
        Data = new DataInfo();
        log = "";
        string sqlQuery = "select * from [" + dbTableName + "] where nation=? and category=?";
        ArrayList OleDbParameters = new ArrayList();
        OleDbParameters.Add(new OleDbParameter("nation", _nation));
        OleDbParameters.Add(new OleDbParameter("category", _category));
        DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
        log = sql.log;
        if (!isStrNull(log))
        {
            success = false;
        }
        else
        {
            if (dt.Rows.Count > 0)
            {
                Data.subject = ValString(dt.Rows[0]["subject"]);
                Data.word = ValString(dt.Rows[0]["word"]);
                Data.status = (dt.Rows[0]["status"].ToString() == "Y" ? true : false);
            }
            else
            {
                sqlQuery = "insert into  [" + dbTableName + "] (nation,category,subject,word,status) values (?,?,?,?,?)";
                OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("nation", _nation));
                OleDbParameters.Add(new OleDbParameter("category", _category));
                OleDbParameters.Add(new OleDbParameter("subject", ""));
                OleDbParameters.Add(new OleDbParameter("word", ""));
                OleDbParameters.Add(new OleDbParameter("status", "N"));
                sql.execute(sqlQuery, OleDbParameters);

                Data.subject = "";
                Data.word = "";
                Data.status = false;
            }
        }
        return success;
    }

    public bool Save()
    {
        log = "";

        string sqlQuery = "update [" + dbTableName + "] set subject=?,word=?,status=? where nation=? and category=?";
        ArrayList OleDbParameters = new ArrayList();
        OleDbParameters.Add(new OleDbParameter("subject", ValString(Data.subject)));
        OleDbParameters.Add(new OleDbParameter("word", ValString(Data.word)));
        OleDbParameters.Add(new OleDbParameter("status", (Data.status ? "Y" : "N")));
        OleDbParameters.Add(new OleDbParameter("nation", _nation));
        OleDbParameters.Add(new OleDbParameter("category", _category));
        bool success = sql.execute(sqlQuery, OleDbParameters);
        if (!success) { log = sql.log; }
        return success;
    }

}