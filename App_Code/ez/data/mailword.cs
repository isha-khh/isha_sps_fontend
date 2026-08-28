///1.15.0216@通知信模組

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
public class mailword : ez.function
{

    ez.sql sql = new ez.sql();
    public string log;
    string _category;
    string _nation;
    public string dbTableName = "mail_words";   //資料表名稱

    public struct DataInfo
    {
        public string subject;
        public string word;
        public bool status;
        public string sender_mail;
        public string sender_name;
        public string email;
    }

    public mailword(string category, string nation)  //建構函式
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
                Data.sender_mail = ValString(dt.Rows[0]["sender_mail"]);
                Data.sender_name = ValString(dt.Rows[0]["sender_name"]);
                Data.email = ValString(dt.Rows[0]["email"]);
            }
            else
            {
                sqlQuery = "insert into  [" + dbTableName + "] (nation,category,subject,word,status,sender_mail,sender_name,email) values (?,?,?,?,?,?,?,?)";
                OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("nation", _nation));
                OleDbParameters.Add(new OleDbParameter("category", _category));
                OleDbParameters.Add(new OleDbParameter("subject", ""));
                OleDbParameters.Add(new OleDbParameter("word", ""));
                OleDbParameters.Add(new OleDbParameter("status", "N"));
                OleDbParameters.Add(new OleDbParameter("sender_mail", ""));
                OleDbParameters.Add(new OleDbParameter("sender_name", ""));
                OleDbParameters.Add(new OleDbParameter("email", ""));
                sql.execute(sqlQuery, OleDbParameters);

                Data.subject = "";
                Data.word = "";
                Data.status = false;
                Data.sender_mail = "";
                Data.sender_name = "";
                Data.email = "";
            }
        }
        return success;
    }

    public bool Save()
    {
        log = "";

        string sqlQuery = "update [" + dbTableName + "] set subject=?,word=?,status=?,sender_mail=?,sender_name=?,email=? where nation=? and category=?";
        ArrayList OleDbParameters = new ArrayList();
        OleDbParameters.Add(new OleDbParameter("subject", ValString(Data.subject)));
        OleDbParameters.Add(new OleDbParameter("word", ValString(Data.word)));
        OleDbParameters.Add(new OleDbParameter("status", (Data.status ? "Y" : "N")));
        OleDbParameters.Add(new OleDbParameter("sender_mail", ValString(Data.sender_mail)));
        OleDbParameters.Add(new OleDbParameter("sender_name", ValString(Data.sender_name)));
        OleDbParameters.Add(new OleDbParameter("email", ValString(Data.email)));
        OleDbParameters.Add(new OleDbParameter("nation", _nation));
        OleDbParameters.Add(new OleDbParameter("category", _category));
        bool success = sql.execute(sqlQuery, OleDbParameters);
        if (!success) { log = sql.log; }
        return success;
    }

}