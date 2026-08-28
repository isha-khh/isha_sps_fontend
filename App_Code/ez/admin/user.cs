///1.15.0327@後台權限模組

using Newtonsoft.Json;
using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Data.OleDb;
using System.Linq;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.UI.WebControls;

/// <summary>
/// 權限系統
/// </summary>

namespace ez.admin
{
    public class user : ez.function
    {

        public user()
        {
            info = new SInfo();
            sName = SC + "_ezAdmin";
        }

        ez.sql sql = new ez.sql();

        public string log = "";
        public loginInfoType loginInfo;
        public string SqlLockStr = "";
        public SInfo info { get; set; }
        public string sName { get; set; }

        #region 資料型別

        public struct loginInfoType
        {
            public string Num;
            public string ID;
            public string Name;
            public string Group;
            public string Power;
            public string LoginTime;
            public string LoginIP;
            public string LoginLastTime;
            public string menuRootName;
            public string menuSubName;
            public bool isLoginDesginMode;
            public bool changePassword;
        }

        #endregion

        #region Session記錄格式

        public class SInfo
        {
            public int num { get; set; }
            public string u_id { get; set; }
            public string power { get; set; }
            public string group { get; set; }
            public string login_time { get; set; }
            public string last_login_time { get; set; }
            public string login_ip { get; set; }
            public string change_password { get; set; }
        }

        private SInfo JDecode(string json)
        {
            json = encrypt.DecryptAutoKey(json);   //解密
            SInfo sItem = JsonConvert.DeserializeObject<SInfo>(json);
            return sItem;
        }

        private string JEecode(SInfo sItem)
        {
            string json = JsonConvert.SerializeObject(sItem);
            json = encrypt.EncryptAutoKey(json);   //加密
            return json;
        }

        #endregion

        #region 登入/登出

        public bool login(string u_id, string u_password, bool isDesignMode = false)
        {
            bool success = false;
            log = "";

            string sqlQuery = "select * from admin where u_id=?";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("u_id", u_id));
            DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
            if (dt.Rows.Count > 0)
            {
                DataRow row = dt.Rows[0];

                if (!isDesignMode && u_password != encrypt.DecryptAutoKey(row["u_password"].ToString()))
                {
                    LoginHistory.Add(u_id, LoginHistory.Status.Incorrect);
                    log = "帳號或密碼錯誤";
                }
                else if ((bool)row["online"])
                {
                    if (isStrNull(row["pass_effective_date"]) || DateTime.Compare(DateTime.Today, ValDate(row["pass_effective_date"])) <= 0 || supervisor.effective_day == 0)
                    {
                        if (isStrNull(row["effective_date"]) || DateTime.Compare(ValDate(row["effective_date"]), DateTime.Today) >= 0)
                        {
                            string change_password = "";
                            if (ValString(row["forget_pass"]) == "Y") { change_password = "true"; }
                            string last_login_time = (isStrNull(row["login_time"]) ? "" : dateTimeStr(ValDate(row["login_time"])));
                            string power = "";
                            if (ValString(row["power"]).ToUpper() != "EZ")
                            {
                                sqlQuery = "SELECT items FROM admin_group where g_name=?"; ;
                                OleDbParameters.Clear();
                                OleDbParameters.Add(new OleDbParameter("g_name", ValString(row["power"])));
                                DataTable dt2 = sql.selectTable(sqlQuery, OleDbParameters);
                                if (dt2.Rows.Count > 0)
                                {
                                    DataRow row2 = dt2.Rows[0];
                                    if (!isStrNull(row2["items"]))
                                    {
                                        power = ValString(row2["items"]);
                                    }
                                    else
                                    {
                                        LoginHistory.Add(u_id, LoginHistory.Status.PermissionsNotSet);
                                        log = "您所屬的群組未設定使用權限";
                                    }
                                }
                                else
                                {
                                    LoginHistory.Add(u_id, LoginHistory.Status.GroupNotExist);
                                    log = "您所屬的群組不存在";
                                }
                            }

                            if (log == "")
                            {

                                DateTime ntime = Now();
                                SInfo sInfo = new SInfo();
                                sInfo.num = Val(row["num"]);
                                sInfo.u_id = u_id;
                                sInfo.power = power;
                                sInfo.group = ValString(row["power"]);
                                sInfo.login_time = dateTimeStr(ntime);
                                sInfo.last_login_time = last_login_time;
                                sInfo.change_password = change_password;
                                sInfo.login_ip = PageBase.MyIP;
                                Session[sName] = JEecode(sInfo);

                                ez.data.info WebSet = new ez.data.info();
                                WebSet.Load();
                                if (WebSet.Data.useCookie)    //記錄Cookies
                                {
                                    HttpContext.Current.Response.Cookies[sName].Value = Session[sName].ToString();
                                    HttpContext.Current.Response.Cookies[sName].HttpOnly = true;
                                    //HttpContext.Current.Response.Cookies[sName].Expires = ntime.AddHours(8);
                                }

                                //記錄登入時間和ip
                                sqlQuery = "update admin set login_time=?, login_ip=? where num=?";
                                OleDbParameters.Clear();
                                OleDbParameters.Add(new OleDbParameter("login_time", dateTimeStr(ntime)));
                                OleDbParameters.Add(new OleDbParameter("login_ip", getIP()));
                                OleDbParameters.Add(new OleDbParameter("num", ValString(row["num"])));
                                sql.execute(sqlQuery, OleDbParameters);

                                success = true;
                                log = "登入成功";
                                if (!isStrNull(row["warn_pass_effective_date"]) && supervisor.effective_day > 0)
                                {
                                    if (DateTime.Compare(DateTime.Today, ValDate(row["warn_pass_effective_date"])) >= 0)
                                        log = "提醒您，" + supervisor.effective_day + "天未更改密碼帳號將上鎖";
                                }
                                LoginHistory.Add(u_id, LoginHistory.Status.Success);
                            }
                        }
                        else
                        {
                            LoginHistory.Add(u_id, LoginHistory.Status.Expire);
                            log = "有效期限到期";
                        }
                    }
                    else
                    {
                        LoginHistory.Add(u_id, LoginHistory.Status.Lock);
                        log = "Lock";
                    }
                }
                else
                {
                    LoginHistory.Add(u_id, LoginHistory.Status.Disable);
                    log = "帳號已停用";
                }
            }
            else
            {
                LoginHistory.Add(u_id, LoginHistory.Status.Incorrect);
                log = "帳號或密碼錯誤";
            }
            ez.admin.user.SystemLog.Add(ez.admin.user.SystemLog.Status.Login, log);
            return success;
        }

        public void logout()
        {
            Session[sName] = null;
            Session[SC + "_wrpUpdateCount"] = null;
            if (HttpContext.Current.Request.Cookies[sName] != null)
            {
                HttpContext.Current.Response.Cookies[sName].Expires = Now().AddDays(-1);
            }
        }


        public bool isLogin(bool chkDB = true)
        {
            log = "";
            bool signIn = false;
            write_to_session();

            if (Session[sName] != null)
            {
                try
                {
                    info = JDecode(Session[sName].ToString());
                    if (!chkDB)
                        signIn = true;
                }
                catch (Exception ex)
                {
                    log = ex.Message;
                }

                if (isStrNull(log) && chkDB)
                {
                    string sqlQuery = "select * from admin where u_id=? and num=?";
                    ArrayList OleDbParameters = new ArrayList();
                    OleDbParameters.Add(new OleDbParameter("u_id", info.u_id));
                    OleDbParameters.Add(new OleDbParameter("num", info.num));
                    DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
                    if (dt.Rows.Count > 0)
                    {
                        DataRow row = dt.Rows[0];
                        if ((bool)row["online"])
                        {
                            loginInfo.Num = ValString(row["num"]);
                            loginInfo.ID = ValString(row["u_id"]);
                            loginInfo.Name = ValString(row["u_name"]);
                            loginInfo.Group = info.group;
                            loginInfo.Power = info.power;
                            loginInfo.LoginTime = info.login_time;
                            loginInfo.LoginIP = info.login_ip;
                            loginInfo.LoginLastTime = info.last_login_time;
                            loginInfo.isLoginDesginMode = (loginInfo.Group.ToUpper() == "EZ" ? true : false);
                            loginInfo.changePassword = (loginInfo.Group.ToUpper() == "EZ" ? false : (info.change_password.ToUpper() == "TRUE" ? true : false));
                            signIn = true;
                        }
                        else
                        {
                            log = "帳號已停用";
                        }
                    }
                    else
                    {
                        log = "帳號不存在";
                    }
                }

                if (info.login_ip != getIP() && loginInfo.Group.ToUpper() != "EZ")
                {
                    signIn = false;
                    log = "請重新登入";
                }

            }
            else
            {
                log = "尚未登入";
            }

            return signIn;
        }

        protected void write_to_session()
        {

            //如果有cookies就寫入session           
            if (HttpContext.Current.Request.Cookies[sName] != null)
            {
                Session[sName] = HttpContext.Current.Request.Cookies[sName].Value;
            }

        }

        #endregion

        #region 忘記密碼

        public bool SendPassword(string u_id, string email)
        {
            bool success = false;
            log = "";

            string sqlQuery = "select * from admin where u_id=?";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("u_id", u_id));
            DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
            if (dt.Rows.Count > 0)
            {
                DataRow row = dt.Rows[0];

                if (row["email"].ToString().ToLower().Trim() != email.ToLower().Trim())
                {
                    log = "E-mail錯誤";
                }
                else if ((bool)row["online"])
                {
                    if (isStrNull(row["pass_effective_date"]) || DateTime.Compare(DateTime.Today, ValDate(row["pass_effective_date"])) <= 0 || supervisor.effective_day == 0)
                    {
                        if (isStrNull(row["effective_date"]) || DateTime.Compare(ValDate(row["effective_date"]), DateTime.Today) >= 0)
                        {
                            string u_password = RandCode(6);  //隨機產生6碼的新密碼

                            DateTime n = Now();
                            sqlQuery = "update admin set u_password=?, pass_edit_time=?, forget_pass=?, pass_effective_date=?, warn_pass_effective_date=? where num=?";
                            OleDbParameters = new ArrayList();
                            OleDbParameters.Add(new OleDbParameter("u_password", encrypt.EncryptAutoKey(u_password)));
                            OleDbParameters.Add(new OleDbParameter("pass_edit_time", dateTimeStr(n)));
                            OleDbParameters.Add(new OleDbParameter("forget_pass", "Y"));
                            OleDbParameters.Add(new OleDbParameter("pass_effective_date", (supervisor.effective_day > 0 ? dateTimeStr(n.AddDays(supervisor.effective_day).Date) : (object)DBNull.Value)));
                            OleDbParameters.Add(new OleDbParameter("warn_pass_effective_date", (supervisor.warn_day > 0 ? dateTimeStr(n.AddDays(supervisor.warn_day).Date) : (object)DBNull.Value)));
                            OleDbParameters.Add(new OleDbParameter("num", Val(row["num"])));
                            if (sql.execute(sqlQuery, OleDbParameters))
                            {
                                mailSystem mailSystem = new mailSystem();
                                mailSystem.DataInfo mailData = new mailSystem.DataInfo();

                                mailData.toMail = email;
                                mailData.subject = "密碼通知信";
                                mailData.word = ValString(row["u_name"]) + " ,您好：";
                                mailData.word += "<br>為了安全性考量，我們已為您產生新的密碼，請妥善且牢記您的密碼，登入後重新設定您的密碼。";
                                mailData.word += "<br>您的新密碼：" + u_password;
                                mailData.word += "<br><font color=red>密碼將於30分鐘後失效。</font>";

                                ez.data.info WebSet = new ez.data.info();
                                WebSet.Load();
                                string loginURL = WebSet.Data.url + (WebSet.Data.url.Substring(WebSet.Data.url.Length - 1, 1) != "/" ? "/" : "") + "admin/";
                                string loginLink = "<a href=\"" + loginURL + "\" target=\"_blank\">" + loginURL + "</a>";
                                mailData.word += "<br>登入網址：" + loginLink;
                                mailData.word += "<br><br>此為系統自動發送，請勿回覆，謝謝！";

                                language lan = new language();
                                mailData.nation = lan.getNation();
                                mailSystem.Data = mailData;
                                success = mailSystem.send();
                                log = mailSystem.log;
                            }
                            else
                            {
                                success = false;
                                log = sql.log;
                            }
                        }
                        else
                        {
                            log = "有效期限到期";
                        }
                    }
                    else
                    {
                        log = "Lock";
                    }
                }
                else
                {
                    log = "帳號已停用";
                }
            }
            else
            {
                log = "帳號錯誤";
            }
            ez.admin.user.SystemLog.Add(ez.admin.user.SystemLog.Status.Login, log);
            return success;
        }

        #endregion 

        #region 使用者

        public class supervisor : ez.function
        {
            public supervisor()
            {
                info = new SInfo();
                user user = new user();
                if (Session[user.sName] != null)
                {
                    info = user.JDecode(Session[user.sName].ToString());
                }
            }

            ez.sql sql = new ez.sql();

            public DataInfo Data;
            public DataQuery QuerySource;
            public DataTable QueryView;

            public const int effective_day = 0; //未修改上鎖天數
            public const int warn_day = 0; //未修改提醒天數
            public const int edit_day = 0; //天數內僅能修改1次密碼

            public SInfo info { get; set; }
            public string log;

            #region 資料型別

            public struct DataInfo
            {
                public int num;
                public string u_id;
                public string u_password;
                public string u_name;
                public string email;
                public string power;
                public Boolean? online;
                public Boolean? wrpNews;
                public string demo;
                public DateTime? effective_date;
            }

            public struct DataQuery
            {
                public string u_id;
                public string u_name;
                public string email;
                public string power;
                public Boolean? online;
                public DateTime? reg_time_min;
                public DateTime? reg_time_max;
                public DateTime? login_time_min;
                public DateTime? login_time_max;

                public string SelectColumns;
                public int Total;
                public int? PageSize;
                public int? NowPage;
                public int PrePage;
                public int NextPage;
                public int MaxPage;
                public string Sort;
            }

            #endregion

            #region 查詢

            public bool Query()
            {
                bool success = true;
                log = "";

                QuerySource.Total = 0;

                sql.pageData pageData = new sql.pageData();
                pageData.table = "admin";

                if (!isStrNull(QuerySource.SelectColumns)) { pageData.column = QuerySource.SelectColumns; }
                if (QuerySource.PageSize.HasValue) { pageData.pageSize = QuerySource.PageSize; }
                if (QuerySource.NowPage.HasValue) { pageData.nowPage = QuerySource.NowPage; }

                if (isStrNull(QuerySource.Sort)) { QuerySource.Sort = "reg_time desc"; }
                pageData.sort = QuerySource.Sort;

                ArrayList listParameters = new ArrayList();

                if (info.group.ToUpper() != "EZ")
                {
                    pageData.query = (isStrNull(pageData.query) ? "" : " and ") + "power<>'EZ' and power<>'A'";
                }

                if (!isStrNull(QuerySource.u_id))
                {
                    if (sql.dbIsSql())
                    {
                        pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "u_id like N'%' + ? + '%'";
                    }
                    else
                    {
                        pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "InStr(1,LCase(u_id),LCase(?),0)<>0";
                    }
                    listParameters.Add(new OleDbParameter("u_id", QuerySource.u_id));
                }
                if (!isStrNull(QuerySource.u_name))
                {
                    if (sql.dbIsSql())
                    {
                        pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "u_name like N'%' + ? + '%'";
                    }
                    else
                    {
                        pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "InStr(1,LCase(u_name),LCase(?),0)<>0";
                    }
                    listParameters.Add(new OleDbParameter("u_name", QuerySource.u_name));
                }
                if (!isStrNull(QuerySource.email))
                {
                    if (sql.dbIsSql())
                    {
                        pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "email like N'%' + ? + '%'";
                    }
                    else
                    {
                        pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "InStr(1,LCase(email),LCase(?),0)<>0";
                    }
                    listParameters.Add(new OleDbParameter("email", QuerySource.email));
                }
                if (!isStrNull(QuerySource.power))
                {
                    pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "power=?";
                    listParameters.Add(new OleDbParameter("power", QuerySource.power));
                }
                if (QuerySource.online.HasValue)
                {
                    pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "online=?";
                    listParameters.Add(new OleDbParameter("online", QuerySource.online));
                }
                if (QuerySource.reg_time_min.HasValue)
                {
                    pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "reg_time>=?";
                    listParameters.Add(new OleDbParameter("reg_time_min", dateTimeStr(QuerySource.reg_time_min.Value)));
                }
                if (QuerySource.reg_time_max.HasValue)
                {
                    pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "reg_time<?";
                    listParameters.Add(new OleDbParameter("reg_time_max", dateTimeStr(QuerySource.reg_time_max.Value.AddDays(1))));
                }
                if (QuerySource.login_time_min.HasValue)
                {
                    pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "login_time>=?";
                    listParameters.Add(new OleDbParameter("login_time_min", dateTimeStr(QuerySource.login_time_min.Value)));
                }
                if (QuerySource.login_time_max.HasValue)
                {
                    pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "login_time<?";
                    listParameters.Add(new OleDbParameter("login_time_max", dateTimeStr(QuerySource.login_time_max.Value.AddDays(1).Date)));
                }

                if (listParameters.Count > 0)
                {
                    pageData.parameters = listParameters;
                }

                if (pageData.load())
                {
                    QueryView = pageData.sqlDataPage;
                }
                else
                {
                    success = false;
                    log = pageData.log;
                }

                QuerySource.NowPage = Val(pageData.nowPage);
                QuerySource.MaxPage = Val(pageData.maxPage);
                QuerySource.PrePage = Val(pageData.prePage);
                QuerySource.NextPage = Val(pageData.nextPage);
                QuerySource.Total = pageData.total;

                return success;
            }

            #endregion

            #region 新增

            public bool IsExist(string u_id)
            {
                bool exist = false;
                string sqlQuery = "select num from admin where u_id=?";
                ArrayList OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("u_id", u_id));
                DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
                if (dt.Rows.Count > 0) { exist = true; }
                return exist;
            }

            public bool Add()
            {
                bool success = true;
                log = "";
                if (!IsExist(Data.u_id))
                {
                    DateTime n = Now();
                    string column = "u_id,u_password,u_name,email,power,online,demo,wrp_news,effective_date,pass_list,pass_effective_date,warn_pass_effective_date";
                    string sqlQuery = "insert into admin (" + column + ") values (" + sql.mark(column) + ")";
                    ArrayList OleDbParameters = new ArrayList();
                    OleDbParameters.Add(new OleDbParameter("u_id", Data.u_id));
                    OleDbParameters.Add(new OleDbParameter("u_password", encrypt.EncryptAutoKey(Data.u_password)));
                    OleDbParameters.Add(new OleDbParameter("u_name", Data.u_name));
                    OleDbParameters.Add(new OleDbParameter("email", Data.email));
                    OleDbParameters.Add(new OleDbParameter("power", Data.power));
                    OleDbParameters.Add(new OleDbParameter("online", Data.online));
                    OleDbParameters.Add(new OleDbParameter("demo", Data.demo));
                    OleDbParameters.Add(new OleDbParameter("wrp_news", (Data.wrpNews.Value ? "Y" : "N")));
                    OleDbParameters.Add(new OleDbParameter("effective_date", (Data.effective_date.HasValue ? dateTimeStr(Data.effective_date.Value) : (object)DBNull.Value)));
                    OleDbParameters.Add(new OleDbParameter("pass_list", JsonConvert.SerializeObject((new string[] { encrypt.EncryptAutoKey(Data.u_password) }).ToList())));
                    OleDbParameters.Add(new OleDbParameter("pass_effective_date", (effective_day > 0 ? dateTimeStr(n.AddDays(effective_day).Date) : (object)DBNull.Value)));
                    OleDbParameters.Add(new OleDbParameter("warn_pass_effective_date", (warn_day > 0 ? dateTimeStr(n.AddDays(warn_day).Date) : (object)DBNull.Value)));
                    success = sql.execute(sqlQuery, OleDbParameters);
                    log = sql.log;
                }
                else
                {
                    success = false;
                    log = "帳號已存在";
                }
                ez.admin.user.SystemLog.Add(ez.admin.user.SystemLog.Status.Add, "權限管理系統/後端使用者：" + (isStrNull(log) ? "新增成功(" + Data.u_name + ")" : log));
                return success;
            }

            #endregion

            #region 讀取

            public bool Load(int num, bool limitPower = true)
            {
                Data = new DataInfo();
                bool success = true;
                log = "";

                string sqlQuery = "select * from [admin] where num=?";
                ArrayList OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("num", num));
                if (info.group.ToUpper() != "EZ" && limitPower)
                {
                    sqlQuery += " and power<>'EZ' and power<>'A'";
                }
                DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
                if (dt.Rows.Count > 0)
                {
                    DataRow row = dt.Rows[0];
                    Data.u_id = ValString(row["u_id"]);
                    Data.u_name = ValString(row["u_name"]);
                    Data.email = ValString(row["email"]);
                    Data.power = ValString(row["power"]);
                    Data.online = Convert.ToBoolean(row["online"]);
                    Data.demo = ValString(row["demo"]);
                    Data.wrpNews = true;
                    if (!isStrNull(row["wrp_news"]))
                    {
                        Data.wrpNews = (row["wrp_news"].ToString() == "Y" ? true : false);
                    }
                    if (!isStrNull(row["effective_date"])) { Data.effective_date = ValDate(row["effective_date"]); }
                }
                else
                {
                    success = false;
                }
                log = sql.log;

                if (!isStrNull(log))
                {
                    success = false;
                }

                return success;
            }

            public List<string> HistoryPassword(int num)
            {
                string sqlQuery = "select pass_list from [admin] where num=?";
                ArrayList OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("num", num));
                DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
                if (dt.Rows.Count > 0)
                {
                    DataRow row = dt.Rows[0];
                    if (!isStrNull(row["pass_list"]))
                    {
                        return JsonConvert.DeserializeObject<List<string>>(ValString(row["pass_list"]));
                    }
                }
                return new List<string>();
            }

            //前五次密碼
            public bool CheckHistoryPassword(int num, string u_password)
            {
                List<string> list = HistoryPassword(num);
                foreach (string pwd in list)
                {
                    if (encrypt.DecryptAutoKey(pwd) == u_password)
                    {
                        return true;
                    }
                }
                return false;
            }

            public bool CheckEditCount(int num)
            {
                string sqlQuery = "select pass_edit_time from admin where num=? and forget_pass<>'Y'";
                ArrayList OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("num", num));
                DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
                if (dt.Rows.Count > 0)
                {
                    DataRow row = dt.Rows[0];
                    if (isStrNull(row["pass_edit_time"]) || DateTime.Compare(ValDate(row["pass_edit_time"]).AddDays(edit_day * -1).Date, DateTime.Today) >= 0)
                    {

                    }
                    else
                    {
                        return false;
                    }
                }
                return true;
            }


            #endregion

            #region 修改 

            public bool Edit()
            {
                bool success = true;
                log = "";

                string column = "u_id,u_name,email,power,online,demo,wrp_news,effective_date";

                string sqlQuery = "update admin set " + sql.mark2(column) + " where num=?";
                ArrayList OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("u_id", Data.u_id));
                OleDbParameters.Add(new OleDbParameter("u_name", Data.u_name));
                OleDbParameters.Add(new OleDbParameter("email", Data.email));
                OleDbParameters.Add(new OleDbParameter("power", Data.power));
                OleDbParameters.Add(new OleDbParameter("online", Data.online));
                OleDbParameters.Add(new OleDbParameter("demo", Data.demo));
                OleDbParameters.Add(new OleDbParameter("wrp_news", (Data.wrpNews.Value ? "Y" : "N")));
                OleDbParameters.Add(new OleDbParameter("effective_date", (Data.effective_date.HasValue ? dateTimeStr(Data.effective_date.Value) : (object)DBNull.Value)));
                OleDbParameters.Add(new OleDbParameter("num", Data.num));
                success = sql.execute(sqlQuery, OleDbParameters);
                log = sql.log;
                ez.admin.user.SystemLog.Add(ez.admin.user.SystemLog.Status.Edit, "權限管理系統/後端使用者：" + (isStrNull(log) ? "修改成功(" + Data.u_name + ")" : log));
                return success;
            }

            public bool ChangePassword()
            {
                bool success = true;
                log = "";

                if (!isStrNull(Data.u_password))
                {
                    if (CheckHistoryPassword(Data.num, Data.u_password))
                    {
                        success = false;
                        log = "密碼不得與前5次相同";
                    }
                    else
                    {
                        if (edit_day > 0 && !CheckEditCount(Data.num))
                        {
                            success = false;
                            log = "變更密碼須至少大於" + edit_day + "天";
                        }
                        else
                        {
                            List<string> list = HistoryPassword(Data.num);
                            list = ListLast(list, 4);
                            list.Add(encrypt.EncryptAutoKey(Data.u_password));

                            DateTime n = Now();
                            string sqlQuery = "update admin set u_password=?, pass_edit_time=?, pass_list=?, pass_effective_date=?, warn_pass_effective_date=?, forget_pass=? where num=?";
                            ArrayList OleDbParameters = new ArrayList();
                            OleDbParameters.Add(new OleDbParameter("u_password", encrypt.EncryptAutoKey(Data.u_password)));
                            OleDbParameters.Add(new OleDbParameter("pass_edit_time", dateTimeStr(n)));
                            OleDbParameters.Add(new OleDbParameter("pass_list", JsonConvert.SerializeObject(list)));
                            OleDbParameters.Add(new OleDbParameter("pass_effective_date", (effective_day > 0 ? dateTimeStr(n.AddDays(effective_day).Date) : (object)DBNull.Value)));
                            OleDbParameters.Add(new OleDbParameter("warn_pass_effective_date", (warn_day > 0 ? dateTimeStr(n.AddDays(warn_day).Date) : (object)DBNull.Value)));
                            OleDbParameters.Add(new OleDbParameter("forget_pass", (object)DBNull.Value));
                            OleDbParameters.Add(new OleDbParameter("num", Data.num));
                            success = sql.execute(sqlQuery, OleDbParameters);
                            log = sql.log;
                        }
                    }
                }
                else
                {
                    success = false;
                    log = "未輸入密碼";
                }
                ez.admin.user.SystemLog.Add(ez.admin.user.SystemLog.Status.ChangePassword, "權限管理系統/變更管理密碼：" + (isStrNull(log) ? "成功" : log));
                return success;
            }

            public List<string> ListLast(List<string> list, int last)
            {
                if (list.Count > last)
                {
                    list.Remove(list.First());
                    return ListLast(list, last);
                }
                else { return list; }
            }

            public void wrpNewsSet(int num, bool enable)
            {
                string sqlQuery = "update admin set wrp_news=? where num=?";
                ArrayList OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("wrp_news", (enable ? "Y" : "N")));
                OleDbParameters.Add(new OleDbParameter("num", num));
                sql.execute(sqlQuery, OleDbParameters);
            }

            #endregion

            #region 刪除

            public bool Del(int num)
            {
                bool success = true;
                log = "";
                if (!isStrNull(num))
                {
                    int[] nums = { num };
                    success = Del(nums);
                }
                else
                {
                    success = false;
                    log = "尚未指定要刪除的資料";
                }
                return success;
            }

            public bool Del(int[] nums)
            {
                bool success = true;
                log = "";
                if (nums.Length > 0)
                {
                    string sqlQuery = "delete from admin where num in (" + string.Join(",", nums) + ")";
                    success = sql.execute(sqlQuery);
                    log = sql.log;
                }
                else
                {
                    success = false;
                    log = "尚未指定要刪除的資料";
                }
                ez.admin.user.SystemLog.Add(ez.admin.user.SystemLog.Status.Del, "權限管理系統/後端使用者：" + (isStrNull(log) ? "刪除成功" : log));
                return success;
            }

            #endregion

            #region 群組選項

            public void initGroup(DropDownList obj)
            {
                string sqlQuery = "select g_name,demo from admin_group";
                if (info.group.ToUpper() != "EZ")
                {
                    sqlQuery += " where g_name<>'EZ' and g_name<>'A'";
                }
                sqlQuery += " order by g_name";
                DataTable dt = sql.selectTable(sqlQuery);
                if (dt.Rows.Count > 0)
                {
                    foreach (DataRow row in dt.Rows)
                    {
                        string itemStr = ValString(row["g_name"]);
                        if (!isStrNull(row["demo"])) { itemStr += "." + ValString(row["demo"]); }
                        obj.Items.Add(new ListItem(itemStr, ValString(row["g_name"])));
                    }
                }
            }

            #endregion

        }

        #endregion

        #region 登入歷史記錄

        public class LoginHistory : ez.function
        {
            ez.sql sql = new ez.sql();
            public string log { get; set; }
            public DataQuery QuerySource;
            public DataTable QueryView;

            public static void Add(string u_id, Status status)
            {
                sql sql = new sql();
                function f = new function();
                string column = "u_id,login_time,login_ip,status,agent";
                string sqlQuery = "insert into [admin_log] (" + column + ") values (" + sql.mark(column) + ")";
                ArrayList OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("u_id", u_id));
                OleDbParameters.Add(new OleDbParameter("login_time", f.dateTimeStr(f.Now())));
                OleDbParameters.Add(new OleDbParameter("login_ip", f.getIP().Replace("本機", "127.0.0.1")));
                OleDbParameters.Add(new OleDbParameter("status", status));
                OleDbParameters.Add(new OleDbParameter("agent", UserAgent));
                sql.execute(sqlQuery, OleDbParameters);

                //只保留1年內的登入記錄
                sqlQuery = "delete from [admin_log] where login_time<?";
                OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("login_time", f.dateTimeStr(f.Now().AddYears(-1))));
                sql.execute(sqlQuery, OleDbParameters);
            }

            public enum Status
            {
                [Description("登入成功")]
                Success = 1,
                [Description("帳號已停用")]
                Disable = 2,
                [Description("有效期限到期")]
                Expire = 3,
                [Description("帳號或密碼錯誤")]
                Incorrect = 4,
                [Description("帳號的群組不存在")]
                GroupNotExist = 5,
                [Description("未設定使用權限")]
                PermissionsNotSet = 6,
                [Description("帳號已上鎖")]
                Lock = 7
            }

            public static string UserAgent
            {
                get
                {
                    string u = HttpContext.Current.Request.ServerVariables["HTTP_USER_AGENT"];
                    Regex b = new Regex(@"android.+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino", RegexOptions.IgnoreCase | RegexOptions.Multiline);
                    Regex v = new Regex(@"1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(di|rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-", RegexOptions.IgnoreCase | RegexOptions.Multiline);
                    if ((b.IsMatch(u) || v.IsMatch(u.Substring(0, 4))))
                        return "手機";
                    else
                        return "電腦";
                }
            }

            #region 資料型別

            public struct DataQuery
            {
                public string u_id;
                public string login_ip;
                public Status? status;
                public DateTime? login_time_min;
                public DateTime? login_time_max;

                public string SelectColumns;
                public int Total;
                public int? PageSize;
                public int? NowPage;
                public int PrePage;
                public int NextPage;
                public int MaxPage;
                public string Sort;
            }

            #endregion

            #region 查詢

            public bool Query()
            {
                bool success = true;
                log = "";
                QuerySource.Total = 0;

                sql.pageData pageData = new sql.pageData();
                pageData.table = "admin_log";

                if (!isStrNull(QuerySource.SelectColumns)) { pageData.column = QuerySource.SelectColumns; }
                if (QuerySource.PageSize.HasValue) { pageData.pageSize = QuerySource.PageSize; }
                if (QuerySource.NowPage.HasValue) { pageData.nowPage = QuerySource.NowPage; }

                if (isStrNull(QuerySource.Sort)) { QuerySource.Sort = "login_time desc"; }
                pageData.sort = QuerySource.Sort;

                ArrayList listParameters = new ArrayList();

                if (!isStrNull(QuerySource.u_id))
                {
                    if (sql.dbIsSql())
                    {
                        pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "u_id like N'%' + ? + '%'";
                    }
                    else
                    {
                        pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "InStr(1,LCase(u_id),LCase(?),0)<>0";
                    }
                    listParameters.Add(new OleDbParameter("u_id", QuerySource.u_id));
                }
                if (!isStrNull(QuerySource.login_ip))
                {
                    if (sql.dbIsSql())
                    {
                        pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "login_ip like N'%' + ? + '%'";
                    }
                    else
                    {
                        pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "InStr(1,LCase(login_ip),LCase(?),0)<>0";
                    }
                    listParameters.Add(new OleDbParameter("login_ip", QuerySource.login_ip));
                }

                if (QuerySource.status.HasValue)
                {
                    pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "status=?";
                    listParameters.Add(new OleDbParameter("status", QuerySource.status.Value));
                }
                if (QuerySource.login_time_min.HasValue)
                {
                    pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "login_time>=?";
                    listParameters.Add(new OleDbParameter("login_time_min", dateTimeStr(QuerySource.login_time_min.Value)));
                }
                if (QuerySource.login_time_max.HasValue)
                {
                    pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "login_time<?";
                    listParameters.Add(new OleDbParameter("login_time_max", dateTimeStr(QuerySource.login_time_max.Value.AddDays(1).Date)));
                }

                if (listParameters.Count > 0)
                {
                    pageData.parameters = listParameters;
                }

                if (pageData.load())
                {
                    QueryView = pageData.sqlDataPage;
                }
                else
                {
                    success = false;
                    log = pageData.log;
                }

                QuerySource.NowPage = Val(pageData.nowPage);
                QuerySource.MaxPage = Val(pageData.maxPage);
                QuerySource.PrePage = Val(pageData.prePage);
                QuerySource.NextPage = Val(pageData.nextPage);
                QuerySource.Total = pageData.total;

                return success;
            }

            #endregion

        }


        #endregion

        #region 群組

        public class group : ez.function
        {
            public group()
            {
                info = new SInfo();
                user user = new user();
                if (Session[user.sName] != null)
                {
                    info = user.JDecode(Session[user.sName].ToString());
                }
            }

            ez.sql sql = new ez.sql();

            public DataInfo Data;
            public DataQuery QuerySource;
            public DataTable QueryView;
            public SInfo info;
            public string log;

            #region 資料型別

            public struct DataInfo
            {
                public int num;
                public string g_name;
                public string items;
                public string demo;
            }

            public struct DataQuery
            {
                public string g_name;
                public string demo;
                public string SelectColumns;
                public int Total;
                public int? PageSize;
                public int? NowPage;
                public int PrePage;
                public int NextPage;
                public int MaxPage;
                public string Sort;
            }


            #endregion

            #region 查詢

            public bool Query()
            {
                bool success = true;
                log = "";

                QuerySource.Total = 0;

                sql.pageData pageData = new sql.pageData();
                pageData.table = "admin_group";

                if (!isStrNull(QuerySource.SelectColumns)) { pageData.column = QuerySource.SelectColumns; }
                if (QuerySource.PageSize.HasValue) { pageData.pageSize = QuerySource.PageSize; }
                if (QuerySource.NowPage.HasValue) { pageData.nowPage = QuerySource.NowPage; }

                if (isStrNull(QuerySource.Sort)) { QuerySource.Sort = "num desc"; }
                pageData.sort = QuerySource.Sort;

                ArrayList listParameters = new ArrayList();

                if (info.group.ToUpper() != "EZ")
                {
                    pageData.query = "g_name<>'EZ' and g_name<>'A'";
                }

                if (!isStrNull(QuerySource.g_name))
                {
                    pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "g_name=?";
                    listParameters.Add(new OleDbParameter("g_name2", QuerySource.g_name));
                }
                if (!isStrNull(QuerySource.demo))
                {
                    if (sql.dbIsSql())
                    {
                        pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "demo like N'%' + ? + '%'";
                    }
                    else
                    {
                        pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "InStr(1,LCase(demo),LCase(?),0)<>0";
                    }
                    listParameters.Add(new OleDbParameter("demo", QuerySource.demo));
                }
                if (listParameters.Count > 0)
                {
                    pageData.parameters = listParameters;
                }

                if (pageData.load())
                {
                    QueryView = pageData.sqlDataPage;
                }
                else
                {
                    success = false;
                    log = pageData.log;
                }

                QuerySource.NowPage = Val(pageData.nowPage);
                QuerySource.MaxPage = Val(pageData.maxPage);
                QuerySource.PrePage = Val(pageData.prePage);
                QuerySource.NextPage = Val(pageData.nextPage);
                QuerySource.Total = pageData.total;

                return success;
            }

            #endregion

            #region 新增

            public bool IsExist(string g_name)
            {
                bool exist = false;
                string sqlQuery = "select num from admin_group where g_name=?";
                ArrayList OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("g_name", g_name));
                DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
                if (dt.Rows.Count > 0) { exist = true; }
                return exist;
            }

            public bool Add()
            {
                bool success = true;
                log = "";
                if (!IsExist(Data.g_name))
                {
                    if (!isStrNull(Data.items))
                    {
                        string column = "g_name,items,demo";
                        string sqlQuery = "insert into admin_group (" + column + ") values (" + sql.mark(column) + ")";
                        ArrayList OleDbParameters = new ArrayList();
                        OleDbParameters.Add(new OleDbParameter("g_name", Data.g_name));
                        OleDbParameters.Add(new OleDbParameter("items", Data.items));
                        OleDbParameters.Add(new OleDbParameter("demo", Data.demo));
                        success = sql.execute(sqlQuery, OleDbParameters);
                        log = sql.log;
                    }
                    else
                    {
                        success = false;
                        log = "尚未勾選可使用項目";
                    }
                }
                else
                {
                    success = false;
                    log = "群組代號已存在";
                }
                ez.admin.user.SystemLog.Add(ez.admin.user.SystemLog.Status.Add, "權限管理系統/群組資料：" + (isStrNull(log) ? "新增成功(" + Data.demo + ")" : log));
                return success;
            }

            #endregion

            #region 讀取

            public bool Load(int num)
            {
                Data = new DataInfo();
                bool success = true;
                log = "";

                string sqlQuery = "select * from [admin_group] where num=?";
                ArrayList OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("num", num));
                if (info.group.ToUpper() != "EZ")
                {
                    sqlQuery += " and g_name<>'EZ' and g_name<>'A'";
                }
                DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
                if (dt.Rows.Count > 0)
                {
                    DataRow row = dt.Rows[0];
                    Data.num = Val(row["num"]);
                    Data.g_name = ValString(row["g_name"]);
                    Data.items = ValString(row["items"]);
                    Data.demo = ValString(row["demo"]);
                }
                else
                {
                    success = false;
                }
                log = sql.log;

                if (!isStrNull(log))
                {
                    success = false;
                }

                return success;
            }

            #endregion

            #region 修改

            public bool Edit()
            {
                bool success = true;
                log = "";

                if (!isStrNull(Data.items))
                {
                    string sqlQuery = "update admin_group set items=?,demo=? where num=?";
                    ArrayList OleDbParameters = new ArrayList();
                    OleDbParameters.Add(new OleDbParameter("items", Data.items));
                    OleDbParameters.Add(new OleDbParameter("demo", Data.demo));
                    OleDbParameters.Add(new OleDbParameter("num", Data.num));
                    success = sql.execute(sqlQuery, OleDbParameters);
                    log = sql.log;
                }
                else
                {
                    success = false;
                    log = "尚未勾選可使用項目";
                }
                ez.admin.user.SystemLog.Add(ez.admin.user.SystemLog.Status.Edit, "權限管理系統/群組資料：" + (isStrNull(log) ? "修改成功(" + Data.demo + ")" : log));
                return success;
            }

            #endregion

            #region 添加權限

            public bool AddPowerItems(string g_name, string items)
            {
                bool success = true;
                log = "";
                string sqlQuery = "select items from [admin_group] where g_name=?";
                ArrayList OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("g_name", g_name));
                DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
                if (dt.Rows.Count > 0)
                {
                    DataRow row = dt.Rows[0];
                    sqlQuery = "update admin_group set items=? where g_name=?";
                    OleDbParameters = new ArrayList();
                    OleDbParameters.Add(new OleDbParameter("items", ValString(row["items"]) + items));
                    OleDbParameters.Add(new OleDbParameter("g_name", g_name));
                    success = sql.execute(sqlQuery, OleDbParameters);
                    log = sql.log;
                }
                return success;
            }

            #endregion

            #region 刪除

            public bool Del(int num)
            {
                bool success = true;
                log = "";
                if (!isStrNull(num))
                {
                    int[] nums = { num };
                    success = Del(nums);
                }
                else
                {
                    success = false;
                    log = "尚未指定要刪除的資料";
                }
                return success;
            }

            public bool Del(int[] nums)
            {
                bool success = true;
                log = "";
                if (nums.Length > 0)
                {
                    string sqlQuery = "delete from admin_group where num in (" + string.Join(",", nums) + ")";
                    success = sql.execute(sqlQuery);
                    log = sql.log;
                }
                else
                {
                    success = false;
                    log = "尚未指定要刪除的資料";
                }
                ez.admin.user.SystemLog.Add(ez.admin.user.SystemLog.Status.Del, "權限管理系統/群組資料：" + (isStrNull(log) ? "刪除成功" : log));
                return success;
            }

            #endregion


        }

        #endregion

        #region 後台操作記錄

        public class SystemLog : ez.function
        {
            ez.sql sql = new ez.sql();
            public string dbTableName = "system_log";   //資料表名稱
            public string log { get; set; }
            public DataQuery QuerySource;
            public DataTable QueryView;

            public static void Add(Status status, string word = "")
            {
                string dbTableName = "system_log";   //資料表名稱
                sql sql = new sql();
                function f = new function();
                user user = new user();
                if (user.isLogin())
                {
                    if (user.info.u_id.Trim().ToLower() != "admin")
                    {
                        string column = "u_id,login_time,login_ip,status,word";
                        string sqlQuery = "insert into [" + dbTableName + "] (" + column + ") values (" + sql.mark(column) + ")";
                        ArrayList OleDbParameters = new ArrayList();
                        OleDbParameters.Add(new OleDbParameter("u_id", user.info.u_id));
                        OleDbParameters.Add(new OleDbParameter("login_time", f.dateTimeStr(f.Now())));
                        OleDbParameters.Add(new OleDbParameter("login_ip", f.getIP().Replace("本機", "127.0.0.1")));
                        OleDbParameters.Add(new OleDbParameter("status", status));
                        OleDbParameters.Add(new OleDbParameter("word", word));
                        sql.execute(sqlQuery, OleDbParameters);

                        //只保留1年內的登入記錄
                        sqlQuery = "delete from [" + dbTableName + "] where login_time<?";
                        OleDbParameters = new ArrayList();
                        OleDbParameters.Add(new OleDbParameter("login_time", f.dateTimeStr(f.Now().AddYears(-1))));
                        sql.execute(sqlQuery, OleDbParameters);
                    }
                }
            }

            public enum Status
            {
                [Description("新增")]
                Add = 1,
                [Description("修改")]
                Edit = 2,
                [Description("刪除")]
                Del = 3,
                [Description("登入")]
                Login = 4,
                [Description("排序")]
                Sort = 5,
                [Description("密碼變更")]
                ChangePassword = 6
            }

            public static string UserLogData(Status status)
            {
                function f = new function();
                user user = new user();
                if (user.isLogin())
                {
                    return f.getIP() + "::" + f.Now() + "::" + user.info.u_id + "::" + status;
                }
                return "";
            }

            #region 資料型別

            public struct DataQuery
            {
                public string u_id;
                public string login_ip;
                public Status? status;
                public DateTime? login_time_min;
                public DateTime? login_time_max;
                public string word;

                public string SelectColumns;
                public int Total;
                public int? PageSize;
                public int? NowPage;
                public int PrePage;
                public int NextPage;
                public int MaxPage;
                public string Sort;
            }

            #endregion

            #region 查詢

            public bool Query()
            {
                bool success = true;
                log = "";
                QuerySource.Total = 0;

                sql.pageData pageData = new sql.pageData();
                pageData.table = dbTableName;

                if (!isStrNull(QuerySource.SelectColumns)) { pageData.column = QuerySource.SelectColumns; }
                if (QuerySource.PageSize.HasValue) { pageData.pageSize = QuerySource.PageSize; }
                if (QuerySource.NowPage.HasValue) { pageData.nowPage = QuerySource.NowPage; }

                if (isStrNull(QuerySource.Sort)) { QuerySource.Sort = "login_time desc"; }
                pageData.sort = QuerySource.Sort;

                ArrayList listParameters = new ArrayList();

                if (!isStrNull(QuerySource.u_id))
                {
                    if (sql.dbIsSql())
                    {
                        pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "u_id like N'%' + ? + '%'";
                    }
                    else
                    {
                        pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "InStr(1,LCase(u_id),LCase(?),0)<>0";
                    }
                    listParameters.Add(new OleDbParameter("u_id", QuerySource.u_id));
                }
                if (!isStrNull(QuerySource.word))
                {
                    if (sql.dbIsSql())
                    {
                        pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "word like N'%' + ? + '%'";
                    }
                    else
                    {
                        pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "InStr(1,LCase(word),LCase(?),0)<>0";
                    }
                    listParameters.Add(new OleDbParameter("word", QuerySource.word));
                }
                if (!isStrNull(QuerySource.login_ip))
                {
                    if (sql.dbIsSql())
                    {
                        pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "login_ip like N'%' + ? + '%'";
                    }
                    else
                    {
                        pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "InStr(1,LCase(login_ip),LCase(?),0)<>0";
                    }
                    listParameters.Add(new OleDbParameter("login_ip", QuerySource.login_ip));
                }

                if (QuerySource.status.HasValue)
                {
                    pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "status=?";
                    listParameters.Add(new OleDbParameter("status", QuerySource.status.Value));
                }
                if (QuerySource.login_time_min.HasValue)
                {
                    pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "login_time>=?";
                    listParameters.Add(new OleDbParameter("login_time_min", dateTimeStr(QuerySource.login_time_min.Value)));
                }
                if (QuerySource.login_time_max.HasValue)
                {
                    pageData.query += (isStrNull(pageData.query) ? "" : " and ") + "login_time<?";
                    listParameters.Add(new OleDbParameter("login_time_max", dateTimeStr(QuerySource.login_time_max.Value.AddDays(1).Date)));
                }

                if (listParameters.Count > 0)
                {
                    pageData.parameters = listParameters;
                }

                if (pageData.load())
                {
                    QueryView = pageData.sqlDataPage;
                }
                else
                {
                    success = false;
                    log = pageData.log;
                }

                QuerySource.NowPage = Val(pageData.nowPage);
                QuerySource.MaxPage = Val(pageData.maxPage);
                QuerySource.PrePage = Val(pageData.prePage);
                QuerySource.NextPage = Val(pageData.nextPage);
                QuerySource.Total = pageData.total;

                return success;
            }

            #endregion

        }


        #endregion
    }

}

