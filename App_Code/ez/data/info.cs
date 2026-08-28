///1.19.0802@系統設定模組

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Collections;
using System.Data;
using System.Data.OleDb;
using System.Configuration;

public interface WebSetToUC
{
    void WebSetInfoGet(ez.data.info.DataInfo WebSetInfo);
}

namespace ez.data
{
    public class info : ez.function
    {
        ez.sql sql = new ez.sql();

        public string log;
        public string Dir = "~/upload/admin/";   //圖片上傳位置

        //public string faviconXmlPath = "~/App_Xml/browserconfig.xml";

        public struct DataInfo
        {
            public string name;
            public string mail;
            public ArrayList bcc;
            public string bccStr;
            public string url;
            public string last_order_no;
            public bool useCookie;
            public bool openPrivate;
            public string smtp;
            public string smtpPort;
            public string smtpUser;
            public string smtpPassword;
            public bool smtpSSL;
            public string ftp;
            public string ftpPort;
            public string ftpUser;
            public string ftpPassword;
            public string ftpDir;
            public string wrpUser;
            public string wrpPassword;
            public bool wrpNews;
            public string logo;
            public bool kind_expand;
            public string head_code;
            public string body_code;
            public string favicon;
            public string favicon_bg_color;
        }

        public DataInfo Data;

        public void Load()
        {
            Data = new DataInfo();
            log = "";
   

            if (isStrNull(HttpContext.Current.Application[SC + "WebInfo"]) || SC== "ezweb")
            {
                DataTable dt = sql.selectTable("select * from company");
                HttpContext.Current.Application.Lock();
                HttpContext.Current.Application[SC + "WebInfo"] = dt;
                HttpContext.Current.Application.UnLock();
                log = sql.log;
                if (isStrNull(log))
                {
                    DataRow row = dt.Rows[0];
                    Data.name = ValString(row["com_name"]);
                    Data.mail = ValString(row["com_mail"]);
                    Data.url = ValString(row["pic_url"]);
                    Data.last_order_no = ValString(row["last_order_no"]);
                    Data.smtp = ValString(row["smtp_url"]);
                    Data.smtpPort = ValString(row["smtp_port"]);
                    Data.smtpUser = ValString(row["smtp_user"]);
                    Data.smtpPassword = (isStrNull(row["smtp_password"]) ? "" : Base64Decode(ValString(row["smtp_password"])));
                    Data.smtpSSL = (ValString(row["smtp_ssl"]) == "Y" ? true : false);

                    Data.ftp = ValString(row["ftp_url"]);
                    Data.ftpPort = ValString(row["ftp_port"]);
                    Data.ftpUser = ValString(row["ftp_user"]);
                    Data.ftpPassword = (isStrNull(row["ftp_password"]) ? "" : Base64Decode(ValString(row["ftp_password"])));
                    Data.ftpDir = ValString(row["ftp_dir"]);
                    Data.wrpUser = ValString(row["wrp_user"]);
                    Data.wrpPassword = (isStrNull(row["wrp_password"]) ? "" : Base64Decode(ValString(row["wrp_password"])));
                    Data.useCookie = Convert.ToBoolean(row["log_class"]);
                    Data.openPrivate = Convert.ToBoolean(row["log_private"]);
                    Data.bccStr = ValString(row["bcc_mail"]);
                    Data.bcc = new ArrayList();
                    if (!isStrNull(ValString(row["bcc_mail"])))
                    {
                        string[] bccs = ValString(row["bcc_mail"]).Replace(ValString((char)13), "").Split(Convert.ToChar((char)10));
                        foreach (string bccmail in bccs)
                        {
                            if (!isStrNull(bccmail)) { Data.bcc.Add(bccmail); }
                        }
                    }
                    Data.wrpNews = (isStrNull(row["wrp_news"]) ? true : (row["wrp_news"].ToString() == "Y" ? true : false));
                    Data.logo = ValString(row["logo"]);

                    if (!isStrNull(row["kind_expand"]))
                    {
                        Data.kind_expand = (ValString(row["kind_expand"]) == "Y" ? true : false);
                    }
                    Data.head_code = ValString(row["head_code"]);
                    Data.body_code = ValString(row["body_code"]);
                    Data.favicon = ValString(row["favicon"]);
                    Data.favicon_bg_color = ValString(row["favicon_bg_color"]);

                    if (SC != "ezweb")
                    {
                        HttpContext.Current.Application.Lock();
                        HttpContext.Current.Application[SC + "WebInfo"] = Data;
                        HttpContext.Current.Application.UnLock();
                    }

                }
                else
                {
                    HttpContext.Current.Response.Write(sql.log);
                }

            }
            else
            {
                try
                {
                    Data = (DataInfo)HttpContext.Current.Application[SC + "WebInfo"];
                }
                catch (Exception ex)
                {
                    HttpContext.Current.Application.Lock();
                    HttpContext.Current.Application[SC + "WebInfo"] = null;
                    HttpContext.Current.Application.UnLock();
                    Load();
                }
                
            }

           

        }

        public bool SaveMail()
        {
            log = "";
            string sqlQuery = "update company set com_mail=?,bcc_mail=?";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("com_mail", Data.mail));
            OleDbParameters.Add(new OleDbParameter("bcc_mail", Data.bccStr));
            bool success = sql.execute(sqlQuery, OleDbParameters);
            if (!success) { log = sql.log; }

            if (SC != "ezweb")
            {
                HttpContext.Current.Application.Lock();
                HttpContext.Current.Application[SC + "WebInfo"] = null;
                HttpContext.Current.Application.UnLock();
            }


            return success;
        }

        public bool Save()
        {
            log = "";

            string column = "com_name,com_mail,pic_url,smtp_url,smtp_port,smtp_user,smtp_password,smtp_ssl,ftp_url,ftp_port,ftp_user,ftp_password,ftp_dir,wrp_user,wrp_password,log_class,log_private,bcc_mail,wrp_news";
            column += ",logo,kind_expand,head_code,body_code,favicon,favicon_bg_color";

            string sqlQuery = "update company set " + sql.mark2(column);
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("com_name", ValString(Data.name)));
            OleDbParameters.Add(new OleDbParameter("com_mail", ValString(Data.mail)));
            OleDbParameters.Add(new OleDbParameter("pic_url", ValString(Data.url)));
            OleDbParameters.Add(new OleDbParameter("smtp_url", ValString(Data.smtp)));
            OleDbParameters.Add(new OleDbParameter("smtp_port", ValString(Data.smtpPort)));
            OleDbParameters.Add(new OleDbParameter("smtp_user", ValString(Data.smtpUser)));
            OleDbParameters.Add(new OleDbParameter("smtp_password", (isStrNull(Data.smtpPassword) ? "" : Base64Encode(ValString(Data.smtpPassword)))));
            OleDbParameters.Add(new OleDbParameter("smtp_ssl", (Data.smtpSSL ? "Y" : "N")));
            OleDbParameters.Add(new OleDbParameter("ftp_url", ValString(Data.ftp)));
            OleDbParameters.Add(new OleDbParameter("ftp_port", ValString(Data.ftpPort)));
            OleDbParameters.Add(new OleDbParameter("ftp_user", ValString(Data.ftpUser)));
            OleDbParameters.Add(new OleDbParameter("ftp_password", (isStrNull(Data.ftpPassword) ? "" : Base64Encode(ValString(Data.ftpPassword)))));
            OleDbParameters.Add(new OleDbParameter("ftp_dir", ValString(Data.ftpDir)));
            OleDbParameters.Add(new OleDbParameter("wrp_user", ValString(Data.wrpUser)));
            OleDbParameters.Add(new OleDbParameter("wrp_password", (isStrNull(Data.wrpPassword) ? "" : Base64Encode(ValString(Data.wrpPassword)))));
            OleDbParameters.Add(new OleDbParameter("log_class", Data.useCookie));
            OleDbParameters.Add(new OleDbParameter("log_private", Data.openPrivate));
            OleDbParameters.Add(new OleDbParameter("bcc_mail", ValString(Data.bccStr)));
            OleDbParameters.Add(new OleDbParameter("wrp_news", (Data.wrpNews ? "Y" : "N")));
            OleDbParameters.Add(new OleDbParameter("logo", ValString(Data.logo)));
            OleDbParameters.Add(new OleDbParameter("kind_expand", (Data.kind_expand ? "Y" : "N")));
            OleDbParameters.Add(new OleDbParameter("head_code", Data.head_code));
            OleDbParameters.Add(new OleDbParameter("body_code", Data.body_code));
            OleDbParameters.Add(new OleDbParameter("favicon", ValString(Data.favicon)));
            OleDbParameters.Add(new OleDbParameter("favicon_bg_color", ValString(Data.favicon_bg_color)));

            bool success = sql.execute(sqlQuery, OleDbParameters);

            if (SC != "ezweb")
            {
                HttpContext.Current.Application.Lock();
                HttpContext.Current.Application[SC + "WebInfo"] = null;
                HttpContext.Current.Application.UnLock();
            }


            if (!success) { log = sql.log; }
            return success;
        }

    }
}
