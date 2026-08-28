using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Web.UI.HtmlControls;
using System.Data;
using System.Data.OleDb;
using ez.data;
using System.IO;
using System.Net;
using System.Collections;

public partial class admin_item_update : ez.admin.PageBase
{
       
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            ez.data.info WebSet = new ez.data.info();
            WebSet.Load();

            if (!isStrNull(WebSet.Data.wrpUser) && !isStrNull(WebSet.Data.wrpPassword))
            {

                FTP_URL.Text = WebSet.Data.ftp;
                if (!isStrNull(FTP_URL.Text.Trim()))
                {
                    FTP_URL.Text = FTP_URL.Text.Trim();
                    if (FTP_URL.Text.ToLower().IndexOf("ftp://") == -1) { FTP_URL.Text = "ftp://" + FTP_URL.Text; }
                    if (Right(FTP_URL.Text, 1) == "/") { FTP_URL.Text = Left(FTP_URL.Text, FTP_URL.Text.Length - 1); }
                    if (!isStrNull(WebSet.Data.ftpPort.Trim())) { FTP_URL.Text += ":" + WebSet.Data.ftpPort.Trim(); }
                    if (!isStrNull(WebSet.Data.ftpDir.Trim())) { FTP_URL.Text += "/" + WebSet.Data.ftpDir.Trim(); }
                    if (Right(FTP_URL.Text, 1) != "/") { FTP_URL.Text += "/"; }
                }              

                ftpUser.Text = WebSet.Data.ftpUser;
                ftpPassword.Text = WebSet.Data.ftpPassword;


                if (!isStrNull(Request["module"]) && !isStrNull(Request["mid"]) && !isStrNull(Request["key"]))
                {
                    Panel1.Visible = false;
                    string key = MD5(ValString(Request["mid"]) + Base64Encode(WebSet.Data.wrpUser));
                    string moduleURI = ValString(Request["module"]);
                    if (ValString(Request["key"]) == key && moduleURI.ToLower().IndexOf(".wrp.com.tw") > -1)
                    {
                        updateProccess(moduleURI);
                    }
                    else
                    {
                        Label1.Text = "參數錯誤";
                        PlaceHolder2.Visible = true;
                    }
                }
                else
                {
                    ez.admin.configuration configuration = new ez.admin.configuration();
                    configuration.Load();

                    string verUrl = WebSet.Data.url + (WebSet.Data.url.Substring(WebSet.Data.url.Length - 1, 1) != "/" ? "/" : "") + "App_Xml/ver.ashx";
                    verUrl = verUrl.Replace("//App_Xml", "/App_Xml");
                    string apiUrl = configuration.Data.WrpApiUrl + configuration.Data.WrpApiUpdate;
                    string xmlData = ReadPostFormContent(apiUrl, "ver=" + verUrl + "&u_id=" + WebSet.Data.wrpUser + "&u_password=" + MD5(WebSet.Data.wrpPassword));
                    DataTable dt = XmDataTable(xmlData, "more");
                    if (dt.Rows.Count > 0)
                    {
                        Session[SC + "_wrpUpdateCount"] = dt.Rows[0]["Count"];
                    }

                    dt = XmDataTable(xmlData, "row");
                    if (dt.Rows.Count > 0)
                    {
                        PlaceHolder1.Visible = false;
                        dt.DefaultView.Sort = "uptime, num";
                        Repeater1.DataSource = dt.DefaultView;
                        Repeater1.DataBind();
                    }
                }
                
            }

            ManuallyPanel.Visible = loginInfo.isLoginDesginMode;

        }
    }

    #region 手動更新


    protected void ManuallyUpdateButton_Click(object sender, EventArgs e)
    {
        updateProccess(ManuallyModuleURI.Text.Trim());
    }


    #endregion

    #region 更新

    protected void updateButton_Click(object sender, EventArgs e)
    {
        RepeaterItem rItem = (RepeaterItem)((LinkButton)sender).NamingContainer;
        string remoteUri = ((HiddenField)rItem.FindControl("url")).Value;
        updateProccess(remoteUri);
    }

    protected void updateProccess(string remoteUri)
    {

        Label1.Text = "";
        PlaceHolder2.Visible = false;

        if (!isStrNull(remoteUri))
        {

            if (!isStrNull(FTP_URL.Text.Trim()) && !isStrNull(ftpUser.Text.Trim()) && !isStrNull(ftpPassword.Text.Trim()))
            {
                string[] rTmep = remoteUri.Trim().Split('/');

                bool isReInstall = false;
                if (!isStrNull(Session["remoteUri"]) && Session["remoteUri"].ToString() == remoteUri.Trim())
                {
                    isReInstall = true;
                }

                if (Right(rTmep[rTmep.Length - 1], 4).ToLower() == ".zip" && !isReInstall)
                {      
                                 
                    Session["remoteUri"] = remoteUri.Trim();

                    string zipPath = "~/upload/temp/";  //要下載到暫存的資料夾
                    DirectoryInfo fz = new DirectoryInfo(Server.MapPath(zipPath));
                    if (!fz.Exists) { fz.Create(); }

                    zipPath += rTmep[rTmep.Length - 1];   //壓縮檔存的路徑

                    string zipDir = zipPath.ToLower().Replace(".zip", "");  //解壓縮的資料夾路徑

                    WebClient myWebClient = new WebClient();
                    myWebClient.DownloadFile(remoteUri.Trim(), Server.MapPath(zipPath));


                    ez.fileSystem fileSystem = new ez.fileSystem();
                    if (fileSystem.UnZipFiles(zipPath))
                    {
                        string updateXml = zipDir + "/update.xml";  //更新定義檔

                        FileInfo FileInfo = new FileInfo(Server.MapPath(updateXml));
                        if (FileInfo.Exists)
                        {
                            bool success = true;

                            //載入要替換的檔案定義
                            DataTable dt = XmDataTable(ReadFileContent(updateXml), "Copy");
                            if (dt.Rows.Count > 0)
                            {

                                ez.fileSystem.FtpCredential FC = new ez.fileSystem.FtpCredential();
                                FC.Username = ftpUser.Text.Trim();
                                FC.Password = ftpPassword.Text.Trim();

                                foreach (DataRow row in dt.Rows)
                                {
                                    //將指定的資料夾裡面的內容複製到指定的ftp資料夾裡面
                                    string Source = ValString(row["Source"]);
                                    if (Source == "*") { Source = ""; }
                                    string Target = ValString(row["Target"]);

                                    if (fileSystem.FtpCopySoruce(FC, zipDir + (!isStrNull(Source) ? "/" + Source : ""), FTP_URL.Text.Trim() + (!isStrNull(Target) ? Target + "/" : "")))
                                    {
                                        //Label1.Text += "<div>更新成功</div>";
                                    }
                                    else
                                    {
                                        success = false;
                                        Label1.Text += "<div>" + fileSystem.log + "</div>";
                                    }
                                }

                            }

                            

                            if (success)
                            {
                                //載入要擴充語系文字
                                dt = XmDataTable(ReadFileContent(updateXml), "LanguageText");
                                if (dt.Rows.Count > 0)
                                {
                                    ez.language language = new ez.language();
                                    ez.language.LanguageText TextItem = new ez.language.LanguageText();
                                    foreach (DataRow row in dt.Rows)
                                    {
                                        TextItem.name.Add(ValString(row["Name"]).Trim());
                                        TextItem.value.Add(ValString(row["Value"]).Trim());
                                    }
                                    if (!language.AddText(TextItem))
                                    {
                                        success = false;
                                        Label1.Text += "<div>擴充語系文字失敗：</div>";
                                        Label1.Text += "<div>" + language.log + "</div>";
                                    }
                                }
                            }

                            if (success)
                            {
                                //載入要擴充的SITEMAP
                                dt = XmDataTable(ReadFileContent(updateXml), "SitemapPages");
                                if (dt.Rows.Count > 0)
                                {
                                    sitemap sitemap = new sitemap();
                                    List<sitemap.PagesInfo> PagesInfos = new List<sitemap.PagesInfo>();

                                    foreach (DataRow row in dt.Rows)
                                    {
                                        sitemap.PagesInfo PagesInfo = new sitemap.PagesInfo();
                                        PagesInfo.id = ValString(row["id"]).Trim();
                                        PagesInfo.title = ValString(row["title"]).Trim();
                                        PagesInfo.url = ValString(row["url"]).Trim();

                                        PagesInfo.PageInfo = new List<sitemap.PageInfo>();

                                        DataTable dt2 = XmDataTable(ReadFileContent(updateXml), "SitemapPage_" + PagesInfo.id);
                                        if (dt2.Rows.Count > 0)
                                        {
                                            foreach (DataRow row2 in dt2.Rows)
                                            {
                                                sitemap.PageInfo PageInfo = new sitemap.PageInfo();
                                                PageInfo.id = ValString(row2["id"]).Trim();
                                                PageInfo.title = ValString(row2["title"]).Trim();
                                                PageInfo.src = ValString(row2["src"]).Trim();
                                                PagesInfo.PageInfo.Add(PageInfo);
                                            }
                                        }


                                        PagesInfos.Add(PagesInfo);
                                    }

                                    if (!sitemap.AddSiteMap(PagesInfos))
                                    {
                                        success = false;
                                        Label1.Text += "<div>擴充SITEMAP失敗：</div>";
                                        Label1.Text += "<div>" + sitemap.log + "</div>";
                                    }
                                }
                            }

                            if (success)
                            {
                                //載入要執行的SQL指令
                                ez.sql sql = new ez.sql();
                              
                                dt = XmDataTable(ReadFileContent(updateXml), (sql.dbIsSql() ? "SqlCommand" : "AccessCommand"));
                                if (dt.Rows.Count > 0)
                                {
                                    foreach (DataRow row in dt.Rows)
                                    {
                                        if (!sql.execute(ValString(row["Code"])))
                                        {
                                            success = false;
                                            Label1.Text += "<div>執行指令：" + ValString(row["Code"]) + "</div>";
                                            Label1.Text += "<div>" + sql.log + "</div>";
                                        }
                                    }
                                }

                                dt = XmDataTable(ReadFileContent(updateXml), "Command");
                                if (dt.Rows.Count > 0)
                                {
                                    foreach (DataRow row in dt.Rows)
                                    {
                                        if (!sql.execute(ValString(row["Code"])))
                                        {
                                            success = false;
                                            Label1.Text += "<div>執行指令：" + ValString(row["Code"]) + "</div>";
                                            Label1.Text += "<div>" + sql.log + "</div>";
                                        }
                                    }
                                }

                            }

                          
                            if (success)
                            {

                                string items = ""; //管理員要加開的權限清單


                                //增加後台主、次選單                         
                                dt = XmDataTable(ReadFileContent(updateXml), "ItemRootAdd");
                                if (dt.Rows.Count > 0)
                                {
                                    foreach (DataRow row in dt.Rows)
                                    {
                                        ez.admin.item item = new ez.admin.item();
                                        item.title = ValString(row["Title"]).Trim();
                                        item.url = ValString(row["Url"]).Trim();
                                        item.other_url = ValString(row["Other_url"]).Trim();
                                        item.icon = ValString(row["Icon"]).Trim();
                                        item.s_id = ValString(row["S_id"]).Trim();
                                        item.root = 0;
                                        if (item.add())
                                        {

                                            int itemRoot = item.GetLastNum(item.root);
                                            items += itemRoot.ToString() + ",";
                                            string SubItemTag = "ItemSubAdd_" + ValString(row["Code"]);
                                            DataTable dt2 = XmDataTable(ReadFileContent(updateXml), SubItemTag);
                                            if (dt2.Rows.Count > 0)
                                            {

                                                foreach (DataRow row2 in dt2.Rows)
                                                {
                                                    item = new ez.admin.item();
                                                    item.title = ValString(row2["Title"]).Trim();
                                                    item.url = ValString(row2["Url"]).Trim();
                                                    item.other_url = ValString(row2["Other_url"]).Trim();
                                                    item.icon = ValString(row2["Icon"]).Trim();
                                                    item.s_id = ValString(row2["S_id"]).Trim();
                                                    item.root = itemRoot;
                                                    if (item.add())
                                                    {
                                                        items += item.GetLastNum(item.root).ToString() + ",";
                                                    }
                                                    else
                                                    {
                                                        success = false;
                                                        Label1.Text += "<div>執行指令：擴建後台次選單「" + ValString(row2["Title"]).Trim() + "」</div>";
                                                        Label1.Text += "<div>" + item.log + "</div>";
                                                    }
                                                }
                                            }
                                        }
                                        else
                                        {
                                            success = false;
                                            Label1.Text += "<div>執行指令：擴建後台主選單「" + ValString(row["Title"]).Trim() + "」</div>";
                                            Label1.Text += "<div>" + item.log + "</div>";
                                        }

                                    }
                                }

                                //單獨增加後台次選單                         
                                dt = XmDataTable(ReadFileContent(updateXml), "ItemSubAdd");
                                if (dt.Rows.Count > 0)
                                {
                                    foreach (DataRow row in dt.Rows)
                                    {
                                        ez.admin.item item = new ez.admin.item();
                                        item.title = ValString(row["Title"]).Trim();
                                        item.url = ValString(row["Url"]).Trim();
                                        item.other_url = ValString(row["Other_url"]).Trim();
                                        item.icon = ValString(row["Icon"]).Trim();
                                        item.s_id = ValString(row["S_id"]).Trim();
                                        item.root = Val(row["Root"]);
                                        if (!item.add())
                                        {
                                            success = false;
                                            Label1.Text += "<div>執行指令：擴建後台次選單「" + ValString(row["Title"]).Trim() + "」</div>";
                                            Label1.Text += "<div>" + item.log + "</div>";
                                        }

                                    }
                                }

                                if (!isStrNull(items))
                                {
                                    if (success)
                                    {
                                        //開權限
                                        ez.admin.user.group group = new ez.admin.user.group();
                                        group.AddPowerItems("A", items);

                                        //開前台選單
                                        dt = XmDataTable(ReadFileContent(updateXml), "MenuAdd");
                                        if (dt.Rows.Count > 0)
                                        {
                                            foreach (DataRow row in dt.Rows)
                                            {
                                                menu menu = new menu();
                                                ez.language language = new ez.language();
                                                DataTable lanDt = language.RowDataTable();
                                                foreach (DataRow lanRow in lanDt.Rows)
                                                {
                                                    menu.DataInfo info = new menu.DataInfo();
                                                    info.nation = ValString(lanRow["Code"]);
                                                    info.kind = ValString(row["Kind"]).Trim();
                                                    info.kind2 = "";
                                                    info.url = ValString(row["Url"]).Trim();
                                                    info.category = ValString(row["Category"]).Trim();
                                                    info.root = 0;
                                                    menu.Data = info;
                                                    menu.Add();
                                                }
                                              
                                            }
                                        }

                                        //開加購
                                        dt = XmDataTable(ReadFileContent(updateXml), "ModuleAdd");
                                        if (dt.Rows.Count > 0)
                                        {
                                            foreach (DataRow row in dt.Rows)
                                            {
                                                if (!isStrNull(row["Name"]))
                                                {
                                                    ez.admin.configuration.Modules cModules = new ez.admin.configuration.Modules();
                                                    cModules.Add(ValString(row["Name"]).Trim());
                                                }                                              
                                            }
                                        }

                                    }
                                    else
                                    {
                                        //清掉剛開的選單
                                        if (Right(items, 1) == ",") { items = Left(items, items.Length - 1); }
                                        ez.admin.item item = new ez.admin.item();
                                        item.delNums(items.Split(','));
                                    }
                                }

                            }


                            if (success)
                            {
                                ScriptMsg("更新成功，按下確定後網站將會重新編譯，請耐心等候", Request.Url.AbsolutePath);
                            }

                        }
                        else
                        {
                            Label1.Text += "<div>更新失敗：找不到定義檔</div>";
                        }

                    }
                    else
                    {
                        Label1.Text += "<div>解壓縮失敗：" + fileSystem.log + "</div>";
                    }

                    fileSystem.DeleteDir(zipDir);
                    fileSystem.Delete(zipPath);

                }
                else if (isReInstall)
                {
                    Label1.Text += "<div>安裝中請耐心等候，請勿重新整理！<br>若您安裝失敗，請稍候再試或與客服聯絡，謝謝！</div>";
                }
                else
                {
                    Label1.Text += "<div>下載失敗：檔案格式不正確</div>";
                }

            }
            else
            {
                ScriptMsg("尚未設定ftp，請檢查您的ftp位址、帳號、密碼是否皆填寫");
            }
        }
        else
        {
            ScriptMsg("找不到更新檔");
        }

        if (!isStrNull(Label1.Text))
        {
            ScriptMsg("更新失敗，請聯絡業務人員");
            PlaceHolder2.Visible = true;
        }
    }

    #endregion



}