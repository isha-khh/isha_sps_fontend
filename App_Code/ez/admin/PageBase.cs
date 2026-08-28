///1.15.0216@後台PageBase模組

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data;

/// <summary>
/// PageBase 
/// </summary>

namespace ez.admin
{
    public class PageBase : ez.admin.user
    {


        protected override void OnPreInit(System.EventArgs e)
        {
            if (chkAdmIP && (chkTwIP || chkAdmIP_Enable))
            {
                foreach (string key in HttpContext.Current.Request.Form)
                {
                    if (HttpContext.Current.Request.Form[key].ToLower().IndexOf("<img") > -1 && HttpContext.Current.Request.Form[key].ToLower().IndexOf("base64") > -1)
                    {
                        HttpContext.Current.Response.Clear();
                        HttpContext.Current.Response.Write("請勿使用base64編碼的圖片置於內容中");
                        HttpContext.Current.Response.End();
                    }
                }

                if (SC == "ezweb")
                {
                    HttpContext.Current.Response.Clear();
                    HttpContext.Current.Response.Write("Web.config的SC參數請勿使用「ezweb」，請改成您案件的資料夾名稱");
                    HttpContext.Current.Response.End();
                }


                ez.data.template template = new ez.data.template();
                template.Load();

                base.Page.MasterPageFile = template.Data.AdminTemplate;

                if (isLogin())
                {

                    ((BasePageToMaster)this.Master).loginStatusGet(loginInfo);  //傳遞登入狀態給MasterPage

                    string nowUrl = HttpContext.Current.Request.Url.AbsolutePath.ToString().ToLower();

                    if (nowUrl.IndexOf("admin/index2.aspx") == -1 && nowUrl.IndexOf("admin/manual/") == -1)
                    {
                        //檢查使用權限
                        bool permissions = false;
                        string power = loginInfo.Power;

                        if (power.Length > 0)
                        {
                            if (power.Substring(power.Length - 1, 1) == ",")
                            {
                                power = power.Substring(0, power.Length - 1);
                            }
                        }

                        ez.sql sql = new ez.sql();

                        string sqlQuery = "SELECT a.url,a.other_url,a.title as subname,b.title as rootname FROM item as a left join item as b on a.root=b.num  Where a.root<>0";
                        if (!isStrNull(power)) { sqlQuery += " and a.num in (" + power + ")"; }
                        else if (!loginInfo.isLoginDesginMode) { sqlQuery += " and a.num = 0"; }
                        DataTable dt = sql.selectTable(sqlQuery, null);
                        if (dt.Rows.Count > 0)
                        {
                            string nowPageUrl = HttpContext.Current.Request.ServerVariables["URL"].ToString();
                            bool loopOut = false;
                            for (int i = 0; i < dt.Rows.Count; i++)
                            {
                                if (nowPageUrl.IndexOf(dt.Rows[i]["url"].ToString().Replace("~/", "")) > -1)
                                {
                                    loginInfo.menuRootName = dt.Rows[i]["rootname"].ToString();
                                    loginInfo.menuSubName = dt.Rows[i]["subname"].ToString();
                                    if (!isStrNull(HttpContext.Current.Request["num"]))
                                    {
                                        loginInfo.menuSubName = dt.Rows[i]["subname"].ToString().Replace("登錄", "修改");
                                    }
                                    permissions = true;
                                    loopOut = true;
                                }
                                else
                                {
                                    //判斷相關檔案中，是否有符合條件的網址
                                    if (!isStrNull(dt.Rows[i]["other_url"]))
                                    {
                                        string[] vv = dt.Rows[i]["other_url"].ToString().Split(',');
                                        for (int j = 0; j < vv.Length; j++)
                                        {
                                            if (nowPageUrl.IndexOf(vv[j].Replace("~/", "")) > -1)
                                            {
                                                loginInfo.menuRootName = dt.Rows[i]["rootname"].ToString();
                                                loginInfo.menuSubName = dt.Rows[i]["subname"].ToString();
                                                if (!isStrNull(HttpContext.Current.Request["num"]))
                                                {
                                                    loginInfo.menuSubName = dt.Rows[i]["subname"].ToString().Replace("登錄", "修改");
                                                }
                                                permissions = true;
                                                loopOut = true;
                                                break;
                                            }
                                        }
                                    }
                                }
                                if (loopOut) { break; }
                            }
                        }



                        if (loginInfo.isLoginDesginMode) { permissions = true; }

                        if (!permissions)
                        {
                            Session[SC + "_ezAdmin_message"] = "您沒有使用權限";
                            HttpContext.Current.Response.Redirect("~/admin/index2.aspx");
                        }

                    }


                }
                else if (log != "")
                {
                    HttpContext.Current.Response.Redirect("~/admin/index.aspx?log=" + Server.UrlEncode(log));
                }
                else
                {
                    HttpContext.Current.Response.Redirect("~/admin/index.aspx");
                }

                base.OnPreInit(e);
            }
            else
            {
                Response.Clear();
                Response.StatusCode = 404;
                Response.End();
            }

        }

        public static string MyIP
        {
            get
            {
                string myip = HttpContext.Current.Request.UserHostAddress;
                if (myip == "::1")
                    myip = "127.0.0.1";
                return myip;
            }
        }

        public static bool chkAdmIP_Enable
        {
            get
            {
                if (System.Configuration.ConfigurationManager.AppSettings["admIP"] != null)
                    if (System.Configuration.ConfigurationManager.AppSettings["admIP"].ToString().Trim() != "")
                        return true;
                return false;
            }
        }

        public static bool chkAdmIP
        {
            get
            {
                List<string> IPs = new List<string>();
                if (chkAdmIP_Enable)
                {
                    string[] ips = System.Configuration.ConfigurationManager.AppSettings["admIP"].ToString().Split(',');
                    for (int i = 0; i <= ips.Length - 1; i++)
                    {
                        IPs.Add(ips[i]);
                    }
                }

                string myip = MyIP;

                if (IPs.Count > 0)
                {
                    foreach (string IP in IPs)
                    {
                        if (myip.IndexOf(IP) == 0)
                        {
                            return true;
                        }
                    }

                    return false;
                }
                return true;
            }
        }

        public static bool chkTwIP_Enable
        {
            get
            {
                if (System.Configuration.ConfigurationManager.AppSettings["admTwIP"] != null)
                    if (System.Configuration.ConfigurationManager.AppSettings["admTwIP"].ToString().Trim() == "Y")
                        return true;
                return false;
            }
        }

        public static bool chkTwIP
        {
            get
            {
                try
                {
                    if (chkTwIP_Enable)
                    {
                        List<IPArea> iPAreas = new List<IPArea>();

                        try
                        {
                            if (HttpContext.Current.Application["TW_IP"] != null)
                                iPAreas = Newtonsoft.Json.JsonConvert.DeserializeObject<List<IPArea>>(HttpContext.Current.Application["TW_IP"].ToString());
                        }
                        catch (Exception)
                        {
                            HttpContext.Current.Application.Lock();
                            HttpContext.Current.Application["TW_IP"] = null;
                            HttpContext.Current.Application.UnLock();
                        }


                        if (HttpContext.Current.Application["TW_IP"] == null)
                        {
                            function f = new function();
                            string[] ips = f.ReadFileContent("~/App_Script/tw_ip.data").Trim().Split('\n');
                     
                            if (ips.Length>0)
                            {
                                foreach (string _ip in ips)
                                {
                                    string[] ip = _ip.Split('-');
                                    if (ip.Length == 2 && !f.isStrNull(ip[0].Trim()) && !f.isStrNull(ip[1].Trim()))
                                    {
                                        IPArea iPArea = new IPArea();
                                        iPArea.StartIP = IPtoNum(ip[0].Trim());
                                        iPArea.EndIP = IPtoNum(ip[1].Trim());
                                        iPAreas.Add(iPArea);
                                    }                                  
                                }

                                //定義區網IP
                                string[] aIPs = { "127.0.0.1-127.0.0.1", "192.168.0.0-192.168.255.255", "10.0.0.0-10.255.255.255", "172.16.0.0-172.31.255.255" };
                                foreach (string aIP in aIPs)
                                {
                                    IPArea iPArea = new IPArea();
                                    iPArea.StartIP = IPtoNum(aIP.Split('-')[0].ToString().Trim());
                                    iPArea.EndIP = IPtoNum(aIP.Split('-')[1].ToString().Trim());
                                    iPAreas.Add(iPArea);
                                }
                                HttpContext.Current.Application.Lock();
                                HttpContext.Current.Application["TW_IP"] = Newtonsoft.Json.JsonConvert.SerializeObject(iPAreas);
                                HttpContext.Current.Application.UnLock();
                            }
                        }
                      

                        UInt32 myip = IPtoNum(MyIP);
                        foreach (IPArea item in iPAreas)
                        {
                            if (myip >= item.StartIP && myip <= item.EndIP)
                            {
                                return true;
                            }
                        }
                        return false;
                    }

                }
                catch (Exception ex)
                {
                    return false;
                }
                return true;

            }
        }

        public static UInt32 IPtoNum(string ip)
        {
            byte[] b = System.Net.IPAddress.Parse(ip.Trim()).GetAddressBytes();
            Array.Reverse(b);
            return BitConverter.ToUInt32(b, 0);
        }

        public class IPArea
        {
            public UInt32 StartIP { get; set; }
            public UInt32 EndIP { get; set; }
        }



    }
}