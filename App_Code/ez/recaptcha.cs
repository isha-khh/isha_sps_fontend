using System;
using System.Configuration;
using System.Data;
using System.Web;
using ez.data;
using Newtonsoft.Json;

/// <summary>
/// recaptcha 的摘要描述
/// </summary>

namespace ez
{
    public class Recaptcha : ez.function
    {
        public string Sitekey { get; set; }
        public string Secret { get; set; }

        public Recaptcha()
        {
            configExtend c = new configExtend("recaptcha");
            string parameters = "Sitekey,Secret";
            DataTable dt = c.GetSetView(parameters.Split(','));
            if (dt.Rows.Count > 0)
            {
                DataRow row = dt.Rows[0];
                Sitekey = c.ValString(row["Sitekey"]);
                Secret = c.ValString(row["Secret"]);
            }
            else
            {
                //HttpContext.Current.Response.Write("reCAPTCHA未設定金鑰與密鑰");
            }
        }

        public bool Used
        {
            get { return !isStrNull(Sitekey) && !isStrNull(Secret) ? true : false; }
        }

        public string HeaderCode(bool inUpdatePanel=false)
        {
            //若要指定語系，在api.js加上 hl=語系代碼
            string js= "<script src=\"https://www.google.com/recaptcha/api.js" + (inUpdatePanel? "?onload=onloadCallback&render=explicit" : "") + "\" async defer></script>";
            if (inUpdatePanel)
                js += "<script> var onloadCallback = function () {grecaptcha.render('recaptcha', {'sitekey': '" + Sitekey + "' }); };</script>";
            return js;
        }

        public string Embed()
        {
            return "<div id=\"recaptcha\" class=\"g-recaptcha\" data-sitekey=\"" + Sitekey + "\"></div>";
        }

        public bool Verification(System.Web.UI.UpdatePanel upl = null)
        {
            if (upl != null)
                AjaxRecaptcha(upl);

            if (!isStrNull(HttpContext.Current.Request["g-recaptcha-response"]))
            {
                string postData = "response=" + HttpContext.Current.Request["g-recaptcha-response"].ToString() + "&secret=" + Secret;  //要post的資料
                string data = ReadPostFormContent("https://www.google.com/recaptcha/api/siteverify", postData);
                if (!isStrNull(data))
                {
                    Json result = JsonConvert.DeserializeObject<Json>(data);
                    if (result.success)
                        return true;
                }                
            }

            return false;
        }

        public void AjaxRecaptcha(System.Web.UI.UpdatePanel upl)
        {
            System.Web.UI.ScriptManager.RegisterStartupScript(upl, upl.GetType(), "loadCaptcha", "grecaptcha.render('recaptcha', {'sitekey': '" + Sitekey + "' });", true);
        }

        public class Json
        {
            public bool success { get; set; }
            public DateTime challenge_ts { get; set; }
            public string hostname { get; set; }

        }

    }
}

