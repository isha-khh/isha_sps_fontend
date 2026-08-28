///1.20.0107@通用函式模組

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Web.UI.HtmlControls;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.VisualBasic;
using System.Data;
using System.Xml;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Configuration;
using System.Collections;
using System.Data.OleDb;
using HtmlAgilityPack;
using WebMarkupMin.AspNet4.WebForms;
using System.Reflection;
using System.ComponentModel;

/// <summary>
/// 通用函式
/// </summary>
namespace ez 
{
    public class function : MinifiedAndCompressedHtmlPage
    {
        public encrypt encrypt = new encrypt();

        protected override void OnPreInit(System.EventArgs e)
        {
            base.OnPreInit(e);
           // SetDetectXSS();
        }

        #region 變數設定

        public int defautPageSize = 20;   //列表預設每頁幾筆
        public string ckeditorDir = "upload/web/";       //編緝器預設資料夾
        public string  SC = ConfigurationManager.AppSettings["SC"].ToString();
        public string DateFormat = ConfigurationManager.AppSettings["DateFormat"].ToString();
        public string DateTimeFormat = ConfigurationManager.AppSettings["DateTimeFormat"].ToString();
        public string SystemDateTimeFormat = ConfigurationManager.AppSettings["SystemDateTimeFormat"].ToString();  

        #endregion
       
        #region 自訂常用函式

        public bool IsNumeric(object Expression)
        {
            double retNum;
            return Double.TryParse(ValString(Expression), NumberStyles.Any, NumberFormatInfo.InvariantInfo, out retNum);
        }

        public int Val(object Expression)
        {
            int _Int = 0;
            if (!isStrNull(Expression))
            {
                _Int = Convert.ToInt32(ValString(Expression).Replace(",", ""));
            }         
            return _Int;           
        }              
             

        public float ValFloat(object Expression)
        {
            float _Int = 0;
            if (!isStrNull(Expression))
            {
                _Int = Convert.ToSingle(ValString(Expression).Replace(",", ""));
            }
            return _Int;
        }

        public string ValString(object Expression)
        {
            string _String = "";
            _String = Convert.ToString(Expression);
            return _String;
        }

        public string ValMoney(object Expression, int DecimalLength = 2)   //千分位，預設最多到小數點第2位
        {
            string format="N0";
            string[] m = ValString(Expression).Replace(",", "").Split('.');
            if (ValString(Expression).IndexOf(".") > -1)
            {
                int ML = (m[m.Length - 1].Length > DecimalLength ? DecimalLength : m[m.Length - 1].Length);
                if (!isStrNull(m[m.Length - 1])) { format = "N" + ML.ToString(); }
            }
            return ValFloat(Expression).ToString(format);
        }

        public string ValMoneyCh(object Expression)
        {
            string price = Expression.ToString().Split('.')[0];  //去除小數點
            string i = price.Replace(",", "");  //去除千分位

            string[] numc_arr = ("零,壹,貳,參,肆,伍,陸,柒,捌,玖").Split(',');
            string[] unic_arr = (",拾,佰,仟").Split(',');
            string[] unic1_arr = ("元整,萬,億,兆,京").Split(',');
          
            int c0 = 0;
            List<string> str = new List<string>();
            do
            {
                int aa = 0;
                int c1 = 0;
                string s = "";
                //取最右邊四位數跑迴圈,不足四位就全取
                int lan = (i.Length >= 4 ? 4 : i.Length);
                int j = Convert.ToInt32(i.Substring(i.Length - lan, lan));
                while (j > 0)
                {
                    int k = j % 10; //餘數
                    if (k > 0) { aa = 1; s = numc_arr[k] + unic_arr[c1] + s; }
                    else if (k == 0 && aa == 1) { s = "0" + s; }
                    j = j / 10;   //商
                    c1++;
                }
                //轉成中文後丟入陣列,全部為零不加單位
                str.Add((s == "" ? "" : s + unic1_arr[c0]));
                //計算剩餘字串長度
                int count_len = i.Length - 4;
                i = (count_len > 0 ? i.Substring(0, count_len) : "");
                c0++;
            } while (!string.IsNullOrEmpty(i));

            string chstring = "";
            while (str.Count > 0) { chstring += str[str.Count - 1]; str.Remove(str[str.Count - 1]); }

            string pattern = "0+";
            string replacement = "零";
            Regex rgx = new Regex(pattern);
            string result = rgx.Replace(chstring, replacement);

            return result;

        }

        public DateTime ValDate(object Expression)
        {
            DateTime _DateTime = Convert.ToDateTime(Expression);
            return _DateTime;
        }

        public bool isDate(object chkString)
        {
            DateTime dt;
            return DateTime.TryParse(ValString(chkString), out dt);
        }

        public bool isStrNull(object value)
        {
            return (value == null || value == DBNull.Value || value == string.Empty || ValString(value) == "" ? true : false);          
        }

        public string br(string str)
        {
            if (isStrNull(str)) { str = ""; }
            return str.Replace(ValString((char)10), "<br>").Replace(ValString((char)13), "");
        }

        public DateTime Now()
        {
            return DateTime.Now;
        }

        public string Left(object Expression, int Length)
        {
            string str = "";
            str = ValString(Expression);
            if (Length > str.Length) { Length = str.Length; }
            str = str.Substring(0, Length);
            return str;
        }

        public string Right(object Expression, int Length)
        {
            string str = "";
            str = ValString(Expression);
            int startIndex = str.Length - Length;
            if (startIndex < 0) {
                startIndex = 0;
                Length = str.Length;
            }
            str = str.Substring(startIndex, Length);
            return str;            
        }

        public string[] Split(object Expression, string Separator)
        {
            return ValString(Expression).Split(new string[] { Separator }, StringSplitOptions.None);
        }

        public string RepeaterToHtml(Repeater rpt)
        {
            StringWriter sw = new StringWriter();
            HtmlTextWriter htw = new HtmlTextWriter(sw);
            rpt.RenderControl(htw);
            return sw.ToString();
        }

        public string GetEnumsDescription(Enum value)
        {
            FieldInfo fi = value.GetType().GetField(value.ToString());
            DescriptionAttribute[] attributes = (DescriptionAttribute[])fi.GetCustomAttributes(typeof(DescriptionAttribute), false);
            return attributes.Length > 0 ? attributes[0].Description : value.ToString();
        }

        public void InitEnumsOptions<T>(Control obj)
        {
            foreach (object value in Enum.GetValues(typeof(T)))
                if (obj is DropDownList)
                    ((DropDownList)obj).Items.Add(new ListItem(GetEnumsDescription((Enum)value), ((int)value).ToString()));
                else if (obj is RadioButtonList)
                    ((RadioButtonList)obj).Items.Add(new ListItem(GetEnumsDescription((Enum)value), ((int)value).ToString()));
                else if (obj is CheckBoxList)
                    ((CheckBoxList)obj).Items.Add(new ListItem(GetEnumsDescription((Enum)value), ((int)value).ToString()));
        }

        //循環性字元
        public bool isCyclicCharacters(object Expression)
        {
            string str = "";
            str = ValString(Expression);
            if (!isStrNull(str))
            {
                Regex rgx = new Regex(@"(\d+)|(\W+)");
                string[] ary = rgx.Split(str);
                string numbers = "0123456789";
                string words = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                foreach (string s in ary)
                {
                    if (!isStrNull(s) && s.Length > 2)
                    {
                        if (numbers.IndexOf(s) > -1 || words.IndexOf(s.ToUpper()) > -1) { return true; }
                    }
                }
            }
            return false;
        }

        #endregion

        #region 金額轉中文字


        #endregion

        #region 取得IP

        public string getIP()
        {
            string myip = GetIPAddress();
            if (myip == "::1")  { myip = "本機";}
            myip = myip.Split(':')[0];           
            return myip;
        }
      
        public string GetIPAddress()
        {
            System.Web.HttpContext context = System.Web.HttpContext.Current;
            string sIPAddress = context.Request.ServerVariables["HTTP_X_FORWARDED_FOR"];
            if (string.IsNullOrEmpty(sIPAddress))
            {
                return context.Request.ServerVariables["REMOTE_ADDR"];
            }
            else
            {
                string[] ipArray = sIPAddress.Split(new Char[] { ',' });
                return ipArray[0];
            }
        }

        
        #endregion

        #region 加密/解密

        public string MD5(string str)
        {
            return encrypt.MD5(str);
        }

        public static string Base64Encode(string AStr)
        {
            return encrypt.Base64Encode(AStr);          
        }
        
        public static string Base64Decode(string ABase64)
        {
            return encrypt.Base64Decode(ABase64);          
        }


        #endregion

        #region 產生亂碼

        public string RandCode(int Length)
        {
            string rc = "";
            //驗證碼的字元集，去掉了一些容易混淆的字元   
            char[] oCharacter = {
			'2',
			'3',
			'4',
			'5',
			'6',
			'8',
			'9',
			'A',
			'B',
			'C',
			'D',
			'E',
			'F',
			'G',
			'H',
			'J',
			'K',
			'L',
			'M',
			'N',
			'P',
			'R',
			'S',
			'T',
			'W',
			'X',
			'Y'
		};
            Random oRnd = new Random(Guid.NewGuid().GetHashCode());
            for (int i = 1; i <= Length; i++)
            {
                rc += oCharacter[oRnd.Next(0, oCharacter.Length - 1)];
            }
            return rc;
        }

        #endregion

        #region 截字/遮罩

        public string cut_str(string str, int limit)
        {

            return str;   //不截字，避免顏文字之類的圖在viewstate會出錯
            MatchCollection findCount;

            //中日韓3byte以上的字符
            string[] Baseds = { "[\u0080-\uFFFF]" };
           
            string tmp = null;
            int j = 0;
            for (int i = 0; i < str.Length; i++)
            {

                bool isMatch = false;
                foreach (string Based in Baseds)
                {
                    findCount = Regex.Matches(str.Substring(i, 1), Based, RegexOptions.Compiled);
                    if (findCount.Count > 0) { isMatch = true; break; }
                }              

                //找str裡面是否有Based指定的字 
                if (!isMatch)
                {
                    j += 1;
                }
                else
                {
                    j += 2;
                    //一個中文字占兩個
                }
                if (j <= limit)
                {
                    tmp = tmp + str.Substring(i, 1);
                }
                else
                {
                    i -= 1;
                    if (i < str.Length)
                    {
                        if (!isStrNull(str.Substring(i, 1).Trim()))
                        {
                            //捨棄不完整的英文單字或數字                            
                            int n = 0;
                            for (int t = tmp.Length - 1; t >= 0; t--)
                            {
                                n++;

                                bool isMatch2 = false;
                                foreach (string Based in Baseds)
                                {
                                    if (Regex.Matches(tmp.Substring(t, 1), Based, RegexOptions.Compiled).Count > 0) { isMatch2 = true; break; }
                                }

                                if (isMatch2)  //中文字
                                {
                                    tmp = Left(tmp, tmp.Length - n + 1);
                                    break;
                                }
                                else if (isStrNull(tmp.Substring(t, 1).Trim()))
                                {
                                    tmp = Left(tmp, tmp.Length - n);
                                    break;
                                }
                            }
                        }
                        tmp = tmp + "...";
                    }
                    break;
                }
            }
            return tmp;
        }

        public string ValCut(object Expression, int limit)
        {
            return cut_str(ValString(Expression), limit);
        }

        public string ValMark(object Expression, int start, int length, string markChar = "*")
        {
            if (length <= 0) { length = 1; }
            string str = ValString(Expression);
            string _str = "";
            for (int i = 0; i < str.Length; i++)
            {
                _str += (i < start || i >= start + length ? str.Substring(i, 1) : markChar);
            }
            return _str;
        }

        #endregion

        #region Javascript輸出

        public void ScriptMsg(string txt)
        {
            ScriptManager.RegisterClientScriptBlock((Page)HttpContext.Current.Handler, typeof(string), "js", "msgbox('" + txt + "');", true);
        }

        public void ScriptMsg(string txt, string url)
        {
            ScriptManager.RegisterClientScriptBlock((Page)HttpContext.Current.Handler, typeof(string), "js", "msgbox('" + txt + "','','" + url + "');", true);
        }

        public void ScriptJS(string script)
        {
            ScriptManager.RegisterClientScriptBlock((Page)HttpContext.Current.Handler, typeof(string), "js", script, true);
        }

        public void ScriptMsgAjax(string txt)
        {
            ScriptManager.RegisterStartupScript(Page, Page.GetType(), "init", "msgbox(\"" + txt + "\");", true);
        }

        public void ScriptMsgAjax(string txt, string url)
        {
            ScriptManager.RegisterStartupScript(Page, Page.GetType(), "init", "msgbox(\"" + txt + "\",'','" + url + "');", true);
        }

        public void ScriptJSAjax(string script)
        {
            ScriptManager.RegisterStartupScript(Page, Page.GetType(), "init", script, true);
        }

        #endregion

        #region 日期格式轉換

        public string dateTimeStr(DateTime date)
        {
            return date.ToString(SystemDateTimeFormat);
        }
        public string dateTimeStr(DateTime date, string format)
        {
            return date.ToString(format);
        }

        public string dateStr(string date)
        {
            return dateStr(date, DateFormat);
        }

        public string dateStr(string date, string format)
        {
            if (isDate(date))
            {
                date = ValDate(date).ToString(format);
            }
            return date;
        }

        public string CDateTime(string DateTimeStr)
        {
            string dtime = "";
            if (DateTimeStr.Length >= 8)
            {
                dtime += DateTimeStr.Substring(0, 4);
                dtime += "/" + DateTimeStr.Substring(4, 2);
                dtime += "/" + DateTimeStr.Substring(6, 2);
                if (DateTimeStr.Length >= 10) { dtime += " " + DateTimeStr.Substring(8, 2); }
                if (DateTimeStr.Length >= 12) { dtime += ":" + DateTimeStr.Substring(10, 2); }
                if (DateTimeStr.Length >= 14) { dtime += ":" + DateTimeStr.Substring(12, DateTimeStr.Length - 12); }
            }          
            return dtime;
        }

        #endregion

        #region 取得Request.QueryString並排除不要的

        //傳回GET值並拿掉不要的，回傳格式為?xxxx=xxxx&yyyy=yyyy
        public string rtnQueryString(string noUseQuery)
        {
            string new_query = "";
            if (HttpContext.Current.Request.Url.AbsoluteUri.Split('?').Length == 2)
            {
                string[] query = HttpContext.Current.Request.Url.AbsoluteUri.Split('?')[1].Split('&');
                for (int i = 0; i < query.Length; i++)
                {
                    if (query[i].Split('=')[0].ToLower() != noUseQuery.ToLower())
                    {
                        new_query += (new_query == "" ? "?" : "&") + query[i];
                    }
                }
            }
            return new_query;
        }

        public string rtnQueryString(Array noUseQuery)
        {
            string new_query = "";
            if (HttpContext.Current.Request.Url.AbsoluteUri.Split('?').Length == 2)
            {
                string[] query = HttpContext.Current.Request.Url.AbsoluteUri.Split('?')[1].Split('&');
                for (int i = 0; i < query.Length; i++)
                {
                    bool setAdd = true;

                    foreach (string nq in noUseQuery)
                    {
                        if (query[i].Split('=')[0].ToLower() == nq.ToLower())
                        {
                            setAdd = false;
                            break;
                        }
                    }

                    if (setAdd)
                    {
                        new_query += (new_query == "" ? "?" : "&") + query[i];
                    }
                }
            }
            return new_query;
        }

        #endregion

        #region 後台查詢相關

        public string searchQuery(Control mainObj)
        {
            string searchQueryStr = "";
            if (mainObj.Controls.Count > 0)
            {
                foreach (Control obj in mainObj.Controls)
                {
                    int caseSwitch = chkControls(obj);
                    if (caseSwitch > 0)
                    {
                        if (obj.ID.IndexOf("find") > -1)
                        {
                            switch (caseSwitch)
                            {
                                case 1:
                                    if (!isStrNull(((DropDownList)obj).SelectedValue))
                                    {
                                        searchQueryStr += "&" + obj.ID + "=" + Server.UrlEncode(((DropDownList)obj).SelectedValue);
                                    }
                                    break;
                                case 2:
                                    if (!isStrNull(((HtmlInputText)obj).Value.Trim()))
                                    {
                                        searchQueryStr += "&" + obj.ID + "=" + Server.UrlEncode(((HtmlInputText)obj).Value.Trim());
                                    }
                                    break;
                                case 3:
                                    if (!isStrNull(((TextBox)obj).Text.Trim()))
                                    {
                                        searchQueryStr += "&" + obj.ID + "=" + Server.UrlEncode(((TextBox)obj).Text.Trim());
                                    }
                                    break;
                                default:
                                    break;
                            }
                        }
                    }
                    else if (obj.Controls.Count > 0)
                    {
                        searchQueryStr += searchQuery(obj);
                    }
                }
            }
            return searchQueryStr;
        }

        public int chkControls(Control obj)
        {
            if (obj is DropDownList)
            {
                return 1;
            }
            else if (obj is HtmlInputText)
            {
                return 2;
            }
            else if (obj is TextBox)
            {
                return 3;
            }
            return 0;
        }

        #endregion
      
        #region 重新整理排序(所有排序+1)

        public void ResetRange( string dbTableName, int range, string nation)
        {
            ResetRange(dbTableName, range, nation, null, null);
        }

        public void ResetRange(string dbTableName, int range, string nation, string otherQueryCommend, ArrayList otherOleDbParameters)
        {
            string sqlQuery = "update [" + dbTableName + "] set range=range+1 where nation=? and range>=?";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("nation", nation));
            OleDbParameters.Add(new OleDbParameter("range", range));
            if (!isStrNull(otherQueryCommend))
            {
                sqlQuery += (otherQueryCommend.Trim().Substring(0, 3).ToLower() != "and" ? " and " : "") + otherQueryCommend;
                if (otherOleDbParameters.Count > 0)
                {
                    foreach (OleDbParameter Parameter in otherOleDbParameters)
                    {
                        OleDbParameters.Add(new OleDbParameter(Parameter.ParameterName, Parameter.Value));
                    }
                }
            }
            ez.sql sql = new ez.sql();
            sql.execute(sqlQuery, OleDbParameters);
        }

        #endregion

        #region 壓縮ViewState

        /// 壓縮
        private byte[] Compress(byte[] data)
        {
            MemoryStream ms = new MemoryStream();
            GZipStream stream = new GZipStream(ms, CompressionMode.Compress);
            stream.Write(data, 0, data.Length);
            stream.Close();
            return ms.ToArray();
        }

        /// 解壓縮
        public byte[] Decompress(byte[] data)
        {
            MemoryStream ms = new MemoryStream();
            ms.Write(data, 0, data.Length);
            ms.Position = 0;
            GZipStream stream = new GZipStream(ms, CompressionMode.Decompress);
            MemoryStream temp = new MemoryStream();
            byte[] buffer = new byte[1025];
            while (true)
            {
                int read = stream.Read(buffer, 0, buffer.Length);
                if (read <= 0)
                {
                    break;
                }
                else
                {
                    temp.Write(buffer, 0, read);
                }
            }
            stream.Close();
            return temp.ToArray();
        }

        protected override void SavePageStateToPersistenceMedium(object state)
        {
            Pair pair = default(Pair);
            PageStatePersister persister = this.PageStatePersister;
            object ViewState = null;
            if (state is Pair)
            {
                pair = (Pair)state;
                persister.ControlState = pair.First;
                ViewState = pair.Second;
            }
            else
            {
                ViewState = state;
            }
            LosFormatter formatter = new LosFormatter();
            StringWriter writer = new StringWriter();
            formatter.Serialize(writer, ViewState);
            string viewStateStr = writer.ToString();
            byte[] data = Convert.FromBase64String(viewStateStr);
            byte[] compressedData = this.Compress(data);
            string str = Convert.ToBase64String(compressedData);
            persister.ViewState = str;
            persister.Save();
        }

        protected override object LoadPageStateFromPersistenceMedium()
        {
            PageStatePersister persister = this.PageStatePersister;
            persister.Load();

            string viewState = persister.ViewState.ToString();
            byte[] data = Convert.FromBase64String(viewState);
            byte[] uncompressedData = this.Decompress(data);
            string str = Convert.ToBase64String(uncompressedData);
            LosFormatter formatter = new LosFormatter();
            return new Pair(persister.ControlState, formatter.Deserialize(str));
        }



        #endregion

        #region 安全性過瀘

        public void SetDetectXSS()
        {
            //跨站隱碼攻擊偵測
            string[] chkData = {
                "'", "\"", "onmouseover","onclick","onmouseout","script","iframe","prompt"," and "," or "
        };

            Control control = new Control();
            if (control.ResolveUrl("~/").IndexOf("(") > -1)
                throw new HttpException(404, "查無資料");
            if (control.ResolveUrl("~/").IndexOf(")") > -1)
                throw new HttpException(404, "查無資料");


            foreach (string key in HttpContext.Current.Request.QueryString)
            {
                for (int i = 0; i < chkData.Length; i++)
                {
                    if (HttpUtility.UrlDecode(HttpContext.Current.Request.QueryString[key]).ToLower().IndexOf(chkData[i].ToLower()) > -1)
                    {
                        throw new HttpException(404, "查無資料");
                    }
                }
            }
            foreach (string key in HttpContext.Current.Request.Form)
            {
                for (int i = 0; i < chkData.Length; i++)
                {
                    if (HttpUtility.UrlDecode(HttpContext.Current.Request.Form[key]).ToLower().IndexOf(chkData[i].ToLower()) > -1)
                    {
                        throw new HttpException(404, "查無資料");
                    }
                }
            }
        }

        #endregion

        #region 讀檔

        public string ReadPostFormContent(string Uri, string postData)
        {
            string text = "";

            try
            {
                Byte[] byteArray = Encoding.UTF8.GetBytes(postData);
                HttpWebRequest req = WebRequest.Create(Uri) as HttpWebRequest;
                req.Method = "POST";
                req.KeepAlive = false;
                req.ContentType = "application/x-www-form-urlencoded";
                req.ContentLength = byteArray.Length;

                if (Uri.ToLower().IndexOf("https://") > -1)
                {
                    ServicePointManager.ServerCertificateValidationCallback = delegate { return true; };
                    ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
                    req.ClientCertificates.Add(new System.Security.Cryptography.X509Certificates.X509Certificate());
                }

                Stream dataStream = req.GetRequestStream();
                dataStream.Write(byteArray, 0, byteArray.Length);
                dataStream.Close();     
                HttpWebResponse res = req.GetResponse() as HttpWebResponse;
                Stream responseStream = res.GetResponseStream() as Stream;
                StreamReader reader = new StreamReader(responseStream, Encoding.UTF8);
                text = reader.ReadToEnd();
                reader.Close();
            }
            catch (Exception)
            {
                
                //throw;
            }
     
            return text;
        }

        public string ReadFileContent(string path)
        {
            string text = "";
            try
            {
                if (path.IndexOf("~/") > -1) { path = Server.MapPath(path); }

                Stream stream = File.Open(path, FileMode.Open, FileAccess.Read, FileShare.Read);
                StreamReader objReader = new StreamReader(stream);
                text = objReader.ReadToEnd();
                objReader.Close();
                objReader.Dispose();
                stream.Close();
                stream.Dispose();
            }
            catch (Exception)
            {                
                //throw;
            }          
            return text;
        }

        #endregion

        #region XML轉DataTable

        public DataTable XmDataTable(string XmlString, string XmlTag)
        {
            DataTable dt = new DataTable();
            try
            {
                XmlDocument Xmldoc = new XmlDocument();
                Xmldoc.LoadXml(XmlString);
                XmlReader Xmlreader = XmlReader.Create(new System.IO.StringReader(Xmldoc.OuterXml));
                DataSet ds = new DataSet();
                ds.ReadXml(Xmlreader);
                for (int i = 0; i < ds.Tables.Count; i++)
                {
                    if (ds.Tables[i].TableName.ToLower() == XmlTag.ToLower())
                    {
                        dt = ds.Tables[i];
                        break;
                    }
                }

            }
            catch (Exception)
            {

            }

            return dt;
        }

        #endregion

        #region CheckBoxList與ArrayString互轉

        public string CheckBoxListToArrayString(CheckBoxList obj)
        {
            string arrayString = "";
            foreach (ListItem cItem in obj.Items)
            {
                if (cItem.Selected) { arrayString += (arrayString != "" ? "," : "") + cItem.Value; }
            }
            return arrayString;
        }

        public void ArrayStringToCheckBoxList(string arrayString, CheckBoxList obj)
        {
            if (!isStrNull(arrayString))
            {
                string[] arrayStrs = arrayString.Split(',');
                foreach (string arrayStr in arrayStrs)
                {
                    for (int i = 0; i < obj.Items.Count; i++)
                    {
                        if (obj.Items[i].Value == arrayStr)
                        {
                            obj.Items[i].Selected = true;
                            break;
                        }
                    }
                }
            }          
        }

        #endregion

        #region 套用語系文字

        //public void _e(string myString)
        //{
        //    HttpContext.Current.Response.Write(_t(myString));
        //}

        //public void _e(string myString, string nation)
        //{
        //    HttpContext.Current.Response.Write(_t(myString, nation));
        //}

        public string _t(string myString)
        {
            string _text = "";
            ez.language language = new ez.language();
            _text = language.RM().GetString(myString);
            if (!isStrNull(_text))
            {
                return _text;
            }
            else
            {
                TextExpansion(myString);
                return myString;
            }
        }

        public string _t(string myString, string nation)
        {
            string _text = "";
            ez.language language = new ez.language();
            _text = language.RM(nation).GetString(myString);
            if (!isStrNull(_text))
            {
                return _text;
            }
            else
            {
                TextExpansion(myString);
                return myString;
            }
        }

        protected void TextExpansion(string myString)  //擴充詞彙
        {
            string newName = myString;
            string Pattern = " ~`!@#$%^&*()_-+={}[]|\\:;\"'<>?,./，。！、";   //詞彙名稱要剔除掉的字元
            for (int i = 0; i < Pattern.Length; i++)
            {
                newName = newName.Replace(Pattern.Substring(i, 1), "");
            }

            ez.admin.user user = new admin.user();
            if (user.isLogin() && !isStrNull(newName))
            {
                language.LanguageText LangOption = new language.LanguageText();
                List<string> name = new List<string>();
                List<string> value = new List<string>();
                name.Add(newName);
                value.Add(myString);
                LangOption.name = name;
                LangOption.value = value;
                ez.language language = new ez.language();          
                language.AddText(LangOption);
            }
        
        }

        #endregion

        #region 取得JPG縮圖品質

        public int GetPicQuality()
        {
            int val = 80;
            if (!isStrNull(HttpContext.Current.Application[SC + "jpg_quality"]))
            {
                try
                {
                    val = Val(HttpContext.Current.Application[SC + "jpg_quality"]);
                }
                catch (Exception)
                {
                    HttpContext.Current.Application.Lock();
                    HttpContext.Current.Application[SC + "jpg_quality"] = null;
                    HttpContext.Current.Application.UnLock();
                }
              
            }

            if (isStrNull(HttpContext.Current.Application[SC + "jpg_quality"]))
            {
                ez.data.configExtend c = new ez.data.configExtend("global");
                string parameters = "jpg_quality";
                DataTable dt = c.GetSetView(parameters.Split(','));
                if (dt.Rows.Count > 0)
                {
                    DataRow row = dt.Rows[0];
                    if (!isStrNull(row["jpg_quality"]) && IsNumeric(row["jpg_quality"]))            
                        val =Val(row["jpg_quality"]);                
                }
            }

            HttpContext.Current.Application.Lock();
            HttpContext.Current.Application[SC + "jpg_quality"] = val;
            HttpContext.Current.Application.UnLock();
            return val;
        }

        public double GetPicMaxSize()
        {
            int val = 1200;
            if (!isStrNull(HttpContext.Current.Application["jpg_maxSize"]))
            {
                try
                {
                    val = Val(HttpContext.Current.Application["jpg_maxSize"]);
                }
                catch (Exception)
                {
                    HttpContext.Current.Application.Lock();
                    HttpContext.Current.Application["jpg_maxSize"] = null;
                    HttpContext.Current.Application.UnLock();
                }
            }

            if (isStrNull(HttpContext.Current.Application["jpg_maxSize"]))
            {
                ez.data.configExtend c = new ez.data.configExtend("global");
                string parameters = "jpg_maxSize";
                DataTable dt = c.GetSetView(parameters.Split(','));
                if (dt.Rows.Count > 0)
                {
                    DataRow row = dt.Rows[0];
                    if (!isStrNull(row["jpg_maxSize"]) && IsNumeric(row["jpg_maxSize"]))      
                        val = Val(row["jpg_maxSize"]);        
                }
            }

            HttpContext.Current.Application.Lock();
            HttpContext.Current.Application["jpg_maxSize"] = val;
            HttpContext.Current.Application.UnLock();
            return val;
        }

        public System.Drawing.Drawing2D.InterpolationMode GetInterpolationMode()
        {
            return System.Drawing.Drawing2D.InterpolationMode.Default;
        }

        public System.Drawing.Drawing2D.SmoothingMode GetSmoothingMode()
        {
            return System.Drawing.Drawing2D.SmoothingMode.Default;
        }

        public System.Drawing.Drawing2D.CompositingQuality GetCompositingQuality()
        {
            return System.Drawing.Drawing2D.CompositingQuality.Default;
        }

        public bool AutoConvertJPG()
        {
            bool val = true;
            if (!isStrNull(HttpContext.Current.Application[SC + "jpg_convert"]))
            {
                try
                {
                    val = HttpContext.Current.Application[SC + "jpg_convert"].ToString() == "N" ? false : true;
                }
                catch (Exception)
                {
                    HttpContext.Current.Application.Lock();
                    HttpContext.Current.Application[SC + "jpg_convert"] = null;
                    HttpContext.Current.Application.UnLock();
                }
            
            }

            if (isStrNull(HttpContext.Current.Application[SC + "jpg_convert"]))
            {
                ez.data.configExtend c = new ez.data.configExtend("global");
                string parameters = "jpg_convert";
                DataTable dt = c.GetSetView(parameters.Split(','));
                if (dt.Rows.Count > 0)
                {
                    DataRow row = dt.Rows[0];
                    if (!isStrNull(row["jpg_convert"]) )
                        val = ValString(row["jpg_convert"]) == "N" ? false : true;                
                }
            }

            HttpContext.Current.Application.Lock();
            HttpContext.Current.Application[SC + "jpg_convert"] = val;
            HttpContext.Current.Application.UnLock();
            return val;
        }


        #endregion

        #region 移除Html屬性選擇器

        public string HtmlRemoveTarget(string html, string target = "data-nomail")
        {
            HtmlDocument doc = new HtmlDocument();
            doc.LoadHtml(html);
            if (doc.DocumentNode.SelectNodes("//*[@" + target + "]") != null)
                foreach (HtmlNode item in doc.DocumentNode.SelectNodes("//*[@" + target + "]")) item.Remove();
            return doc.DocumentNode.InnerHtml;
        }

        #endregion

        #region 替換url參數
        public string BuildUrl(string url, string ParamText, string ParamValue)
        {
            string[] uri = url.Split('?');
            string[] str = ((uri.Count() > 1) ? url.Split('?')[1] : "").Split('&');
            str = str.AsEnumerable().Where(x => !isStrNull(x) && x.Split('=')[0] != ParamText).Concat(new string[] { ParamText + "=" + ParamValue }).ToArray();
            return url.Split('?')[0] + "?" + string.Join("&", str);
        }
        #endregion


        #region 移除html && javascript 
        /// <summary>
        /// 移除html tag
        /// </summary>
        /// <param name="htmlSource"></param>
        /// <returns></returns>
        public string RemoveHTMLTag(string htmlSource)
        {
            //移除  javascript code.
            htmlSource = Regex.Replace(htmlSource, @"<script[\d\D]*?>[\d\D]*?</script>", String.Empty);

            //移除html tag.
            htmlSource = Regex.Replace(htmlSource, @"<[^>]*>", String.Empty);
            return htmlSource;
        }
        #endregion

        #region 讀取影片youtu.be使用

        public string GetYoutubeCode(string link)
        {
            string v = "";

            //https://youtu.be/
            if (link.IndexOf("?") > -1 && link.ToLower().IndexOf("v=") > -1)
            {
                string[] v1 = link.Split('?');
                if (v1.Length == 2)
                {
                    string[] v2 = Split(v1[1], "&");
                    foreach (string v3 in v2)
                    {
                        if (v3.Split('=').Length > 1 && v3.Split('=')[0].ToLower() == "v") { v = v3.Split('=')[1]; break; }
                    }
                }
            }
            else if (link.IndexOf("/embed/") > -1)
            {
                string[] v1 = link.Split('/');
                if (v1.Length == 5)
                {
                    v = v1[4];
                }

            }
            else if (link.IndexOf("youtu.be/") > -1)
            {
                string[] v1 = link.Split('/');
                if (v1.Length == 4)
                {
                    v = v1[3];
                }

            }
            return v;
        }

        public string Getyoutube(string link, string embedcss = "embed-responsive-4by3")
        {
            string embed = "";
            string v = GetYoutubeCode(link);
            embed = "<div class=\"embed-responsive " + embedcss + "\">";
            embed += "<iframe  src=\"https://www.youtube.com/embed/" + v + "\" frameborder=\"0\" allow=\"accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture\" allowfullscreen></iframe>";
            embed += "</div>";
            return embed;

        }
        public string Getyoutubepic(string link)
        {
            string embed = "";
            string v = GetYoutubeCode(link);
            embed += "http://img.youtube.com/vi/" + v + "/sddefault.jpg";
            return embed;

        }
        public string GetYTPlayer(string link)
        {
            string embed = "";
            string v = GetYoutubeCode(link); ;
            //embed = "<div class=\"video_sec\">";
            //embed += "<div class=\"loadingbar\"><div></div><div></div><div></div><div></div></div>";
            embed += "<div id =\"bgndVideo\"  class=\"player\" data-property=\"{ videoURL:'http://youtu.be/" + v + "' ,containment: '.video_sec',startAt: 0,mute: true,autoPlay: true,loop: true,opacity: 1, addRaster: false, quality: 'large',showControls: true}\"></div>";
            //embed += "</div>";
            return embed;

        }
        #endregion
    }
}
