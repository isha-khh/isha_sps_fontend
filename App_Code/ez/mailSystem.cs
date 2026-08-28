///1.17.1005@信件模組

using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Net.Mail;

/// <summary>
/// mailSystem 的摘要描述
/// </summary>
/// 

namespace ez
{
    public class mailSystem : function
    {
        public string log;
        public DataInfo Data;
            
        public class DataInfo
        {
            public string nation = "";
            public string toMail="";
            public ArrayList bccMail;
            public string formMail = "";
            public string subject = "";
            public string word = "";
            public List<string> ReplyTo = new List<string>();
            public DataInfo()
            {
                bccMail = new ArrayList();
            }
        }

        public bool send()
        {
            log = "";

            ez.data.info WebSet = new ez.data.info();
            WebSet.Load();

            if (isStrNull(Data.formMail)) { Data.formMail = WebSet.Data.mail; }

            string com_name = "";
            if (!isStrNull(Data.nation))
            {
                language lan = new language();
                if (lan.Load(Data.nation))
                {
                    com_name = lan.Data.Com_name;
                }
            }

            MailMessage mail = new MailMessage();
            mail.To.Add(new MailAddress(Data.toMail));  //收件者

            if (Data.ReplyTo.Count > 0)
            {
                foreach (string i in Data.ReplyTo)
                {
                    mail.ReplyToList.Add(i);
                }
            }

            if (!isStrNull(com_name) && Data.formMail.IndexOf("<") == -1)
            {
                mail.From = new MailAddress(Data.formMail, com_name);  //寄件者
            }
            else
            {
                mail.From = new MailAddress(Data.formMail);  //寄件者
            }          

            if (Data.bccMail != null)
            {
                if (Data.bccMail.Count > 0)
                {
                    foreach (string bcc in Data.bccMail)
                    {
                        mail.Bcc.Add(new MailAddress(bcc));
                    }
                }
            }          

            mail.IsBodyHtml = true;
            mail.Subject = (!isStrNull(com_name) ? com_name + " - " : "") + Data.subject;
            mail.Body = Data.word;
            
            SmtpClient smtp = new SmtpClient(WebSet.Data.smtp);
            smtp.EnableSsl = WebSet.Data.smtpSSL;
            if (!isStrNull(WebSet.Data.smtpPort)) { smtp.Port = Val(WebSet.Data.smtpPort); }
        
            ez.data.configExtend c = new ez.data.configExtend("global");
            string UseDefaultCredentials = c.GetSetValue("UseDefaultCredentials");
            if (!isStrNull(UseDefaultCredentials)) { smtp.UseDefaultCredentials = (UseDefaultCredentials == "Y" ? true : false); }

            if (!isStrNull(WebSet.Data.smtpUser) && !isStrNull(WebSet.Data.smtpPassword))
            {
                smtp.Credentials = new System.Net.NetworkCredential(WebSet.Data.smtpUser, WebSet.Data.smtpPassword);
            }

            try
            {
                smtp.Send(mail);               
                return true;
            }
            catch (Exception ex)
            {
                log = ex.Message;
                return false;
            }
        }

    }
}
