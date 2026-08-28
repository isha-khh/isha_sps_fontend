using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Web.UI.HtmlControls;
using System.Collections;
using System.IO;
using System.Data;
using System.Data.OleDb;
using System.Threading;
using System.Xml;

public partial class admin_item_setting : ez.admin.PageBase
{

    string category = "global";
    const string TEST_SQL_IP = "125.227.205.189";   //測試區的SQL IP (還原前檢查是否為測試區的sql)

    protected void Page_Load(object sender, EventArgs e)
    {

        initTab();

        if (!Page.IsPostBack)
        {

            ez.data.info WebSet = new ez.data.info();
            WebSet.Load();

            com_name.Value = WebSet.Data.name;
            com_mail.Value = WebSet.Data.mail;
            bcc_mail.Text = WebSet.Data.bccStr;
            pic_url.Value = WebSet.Data.url;
            qrcodeBtn.NavigateUrl = "~/app_script/qrcode/generator.ashx?val=" + Server.UrlEncode(WebSet.Data.url);


            log_class.Checked = WebSet.Data.useCookie;
            wrp_news.Checked = WebSet.Data.wrpNews;

            log_private.Checked = WebSet.Data.openPrivate;//隱私權政策

            smtp_url.Value = WebSet.Data.smtp;
            smtp_port.Value = WebSet.Data.smtpPort;
            smtp_user.Value = WebSet.Data.smtpUser;
            smtp_password.Attributes.Add("value", WebSet.Data.smtpPassword);
            smtp_ssl.Checked = WebSet.Data.smtpSSL;

            ftp_url.Value = WebSet.Data.ftp;
            ftp_port.Value = WebSet.Data.ftpPort;
            ftp_user.Value = WebSet.Data.ftpUser;
            ftp_password.Attributes.Add("value", WebSet.Data.ftpPassword);
            ftp_dir.Value = WebSet.Data.ftpDir;

            wrp_user.Value = WebSet.Data.wrpUser;
            wrp_password.Attributes.Add("value", WebSet.Data.wrpPassword);

            kind_expand.Checked = WebSet.Data.kind_expand;

            head_code.Text = WebSet.Data.head_code;
            body_code.Text = WebSet.Data.body_code;

            logoShow(WebSet.Dir, WebSet.Data.logo);
            faviconShow(WebSet.Dir, WebSet.Data.favicon);
            faviconBgColor.SelectedValue = WebSet.Data.favicon_bg_color;

            //通用擴充設定      
            if (loginInfo.isLoginDesginMode) { GlobalPlaceHolder.Visible = true; }
            ez.data.configExtend c = new ez.data.configExtend(category);
            string parameters = "jpg_quality,jpg_maxSize,jpg_convert,UseDefaultCredentials,file_size_limit";
            DataTable dt = c.GetSetView(parameters.Split(','));
            if (dt.Rows.Count > 0)
            {
                DataRow row = dt.Rows[0];
                if (!isStrNull(row["jpg_quality"])) { jpg_quality.Text = ValString(row["jpg_quality"]); }
                if (!isStrNull(row["jpg_maxSize"])) { jpg_maxSize.Text = ValString(row["jpg_maxSize"]); }
                if (!isStrNull(row["jpg_convert"])) { jpg_convert.Checked = (ValString(row["jpg_convert"]) == "N" ? false : true); }
                if (!isStrNull(row["UseDefaultCredentials"])) { UseDefaultCredentials.SelectedValue = ValString(row["UseDefaultCredentials"]); }
                if (!isStrNull(row["file_size_limit"]))
                {
                    ez.fileSystem fs = new ez.fileSystem();
                    long diskUsage = fs.SpaceUsage();
                    diskInfo.Text = "已使用 " + ValString(diskUsage) + " MB";
                    diskP.Visible = true;
                    file_size_limit.Value = ValString(row["file_size_limit"]);
                    diskInfo.Text += " / 上限 " + ValString(row["file_size_limit"]) + " MB";
                    diskInfo.Text += " (已使用" + Math.Round((ValFloat(diskUsage) / ValFloat(row["file_size_limit"])) * 100, 0, MidpointRounding.AwayFromZero).ToString() + "%)";
                }
            }

            ez.sql sql = new ez.sql();
            BackupPanel.Visible = (sql.dbIsSql() ? false : true);
            BackupList();


            initRecovery();

        }
    }

    protected void logoShow(string LogoDir, string LogoPic)
    {
        dellogo.Checked = false;
        dellogo.Visible = (!isStrNull(LogoPic) ? true : false);
        logoImg.Visible = (!isStrNull(LogoPic) ? true : false);
        logo.Value = LogoPic;
        if (!isStrNull(LogoPic)) { logoImg.ImageUrl = LogoDir + LogoPic; }
    }

    protected void faviconShow(string FaviconDir, string FaviconPic)
    {
        delfavicon.Checked = false;
        delfavicon.Visible = (!isStrNull(FaviconPic) ? true : false);
        faviconImg.Visible = (!isStrNull(FaviconPic) ? true : false);
        favicon.Value = FaviconPic;
        if (!isStrNull(FaviconPic)) { faviconImg.ImageUrl = FaviconDir + FaviconPic; }
    }

    protected void editButton_Click(object sender, EventArgs e)
    {
        if (Page.IsValid)
        {
            msg.Text = "";
            ez.data.info WebSet = new ez.data.info();
            ez.data.info.DataInfo info = new ez.data.info.DataInfo();
            info.name = com_name.Value.Trim();
            info.mail = com_mail.Value.Trim();
            info.url = pic_url.Value.Trim();

            info.smtp = smtp_url.Value.Trim();
            info.smtpPort = smtp_port.Value.Trim();
            info.smtpUser = smtp_user.Value.Trim();
            info.smtpPassword = smtp_password.Text.Trim();
            info.smtpSSL = smtp_ssl.Checked;

            info.ftp = ftp_url.Value.Trim();
            info.ftpPort = ftp_port.Value.Trim();
            info.ftpUser = ftp_user.Value.Trim();
            info.ftpPassword = ftp_password.Text.Trim();
            info.ftpDir = ftp_dir.Value.Trim();

            info.wrpUser = wrp_user.Value.Trim();
            info.wrpPassword = wrp_password.Text.Trim();

            info.kind_expand = kind_expand.Checked;

            info.head_code = head_code.Text.Trim();
            info.body_code = body_code.Text.Trim();

            info.useCookie = log_class.Checked;
            info.wrpNews = wrp_news.Checked;
            info.openPrivate = log_private.Checked;

            info.bccStr = bcc_mail.Text.Trim();

            info.logo = logo.Value;
            ez.fileSystem fileSystem = new ez.fileSystem();
            string[] pic_name = fileSystem.Upload(WebSet.Dir);
            if (!isStrNull(pic_name[0])) { info.logo = pic_name[0]; }
            if ((dellogo.Checked || !isStrNull(pic_name[0])) && !isStrNull(logo.Value))
            {
                if (isStrNull(pic_name[0])) { info.logo = ""; }
                fileSystem.Delete(WebSet.Dir + logo.Value);    //刪logo            
            }
            logoShow(WebSet.Dir, info.logo);


            info.favicon = favicon.Value;
            if (!isStrNull(pic_name[1])) { info.favicon = pic_name[1]; }
            if ((delfavicon.Checked || !isStrNull(pic_name[1])) && !isStrNull(favicon.Value))
            {
                if (isStrNull(pic_name[1])) { info.favicon = ""; }
                fileSystem.Delete(WebSet.Dir + favicon.Value);    //刪favicon            
            }
            faviconShow(WebSet.Dir, info.favicon);
            info.favicon_bg_color = faviconBgColor.SelectedValue;

            // 寫入XML檔
            //XmlTextWriter xmlWriter = new XmlTextWriter(Server.MapPath(WebSet.faviconXmlPath), null);
            //try
            //{
            //    string xmlFfavicon = "favicon.png";
            //    string xmlFfaviconBgColor = "#fffff";
            //    if (!isStrNull(info.favicon))
            //        xmlFfavicon = "//" + Request.Url.Authority + Split(WebSet.Dir, "~")[1] + info.favicon;
            //    switch (info.favicon_bg_color)
            //    {
            //        case "White":
            //            xmlFfaviconBgColor = "#ffffff";
            //            break;
            //        case "Black":
            //            xmlFfaviconBgColor = "#000000";
            //            break;
            //    }

            //    xmlWriter.WriteStartDocument();
            //    xmlWriter.Formatting = Formatting.Indented;

            //    xmlWriter.WriteStartElement("browserconfig");
            //    xmlWriter.WriteStartElement("msapplication");
            //    xmlWriter.WriteStartElement("tile");

            //    xmlWriter.WriteElementString("square70x70logo", xmlFfavicon, "");
            //    xmlWriter.WriteElementString("square150x150logo", xmlFfavicon, "");
            //    xmlWriter.WriteElementString("TileColor", xmlFfaviconBgColor);

            //    xmlWriter.WriteEndElement();
            //    xmlWriter.WriteEndElement();
            //    xmlWriter.WriteEndElement();

            //    xmlWriter.WriteEndDocument();
            //}
            //catch (Exception ex)
            //{

            //}
            //finally
            //{
            //    xmlWriter.Close();
            //}

            WebSet.Data = info;
            if (WebSet.Save())
            {

                //儲存通用擴充設定
                List<ez.data.configExtend.SetOption> SetOptions = new List<ez.data.configExtend.SetOption>();
                ez.data.configExtend.SetOption Option = new ez.data.configExtend.SetOption();

                Option.parameter = "UseDefaultCredentials";
                Option.data = UseDefaultCredentials.SelectedValue;
                SetOptions.Add(Option);

                if (GlobalPlaceHolder.Visible)
                {
                    Option.parameter = "jpg_quality";
                    Option.data = jpg_quality.Text.Trim();
                    SetOptions.Add(Option);

                    Option.parameter = "jpg_maxSize";
                    Option.data = jpg_maxSize.Text.Trim();
                    SetOptions.Add(Option);

                    Option.parameter = "jpg_convert";
                    Option.data = (jpg_convert.Checked ? "Y" : "N");
                    SetOptions.Add(Option);

                    Option.parameter = "file_size_limit";
                    Option.data = file_size_limit.Value.Trim();
                    SetOptions.Add(Option);

                    Application.Lock();
                    Application[SC + "jpg_quality"] = jpg_quality.Text.Trim();
                    Application["jpg_maxSize"] = jpg_maxSize.Text.Trim();
                    Application[SC + "jpg_convert"] = (jpg_convert.Checked ? "Y" : "N");
                    Application.UnLock();
                }

                ez.data.configExtend c = new ez.data.configExtend(category);
                c.SaveSetView(SetOptions);

                //儲存擴充設定
                foreach (Control uc in PlaceHolder2.Controls)
                {
                    if (!isStrNull(uc.ID) && uc.ID.IndexOf("ConfigExUC") > -1)
                    {
                        ((ConfigExtendUC)PlaceHolder2.FindControl(uc.ID)).SaveConfig();
                    }
                }

                ScriptMsg("更新成功", Request.Url.AbsoluteUri);
            }
            else
            {
                ScriptMsg("更新失敗");
                msg.Text = WebSet.log;
            }

            smtp_password.Attributes.Add("value", WebSet.Data.smtpPassword);
            ftp_password.Attributes.Add("value", WebSet.Data.ftpPassword);
            wrp_password.Attributes.Add("value", WebSet.Data.wrpPassword);

        }
    }

    #region 頁籤

    protected void initTab()
    {

        ez.admin.item item = new ez.admin.item();

        string Powers = loginInfo.Power;
        if (Left(Powers, 1) != ",") { Powers = "," + Powers; }
        if (Right(Powers, 1) != ",") { Powers = Powers + ","; }

        DataTable FaceDt = new DataTable();
        FaceDt.Columns.Add("Tag");
        FaceDt.Columns.Add("Path");
        FaceDt.Columns.Add("Range", typeof(int));

        DirectoryInfo UCDir = new DirectoryInfo(Server.MapPath("~/admin/uc/config/"));
        FileInfo[] FaceFiles = UCDir.GetFiles();
        if (FaceFiles.Length > 0)
        {
            foreach (FileInfo FaceFile in FaceFiles)
            {
                if (FaceFile.Name.ToLower().IndexOf(".ascx.cs") > -1)
                {
                    using (StreamReader sr = new StreamReader(FaceFile.FullName))
                    {
                        string line = sr.ReadLine().Trim();
                        if (Left(line, 3) == "///" && line.Split('@').Length == 2)
                        {
                            string[] temp = line.Replace("///", "").Split('@');
                            if (temp[0].Split(',').Length == 3 && IsNumeric(temp[0].Split(',')[0]))
                            {
                                string[] temp2 = temp[0].Split(',');
                                int range = Val(temp2[0]);
                                string sid = temp2[1];
                                string system = (temp2.Length > 1 ? temp2[2] : "");

                                bool isOk = true;
                                if (!isStrNull(sid) || !isStrNull(system))
                                {
                                    string itemNum = (!isStrNull(sid) ? item.numGetBySID(sid) : item.numGet(system));
                                    if (isStrNull(itemNum)) { isOk = false; }
                                    else if (Powers.IndexOf("," + itemNum + ",") == -1) { isOk = false; }
                                    if (loginInfo.isLoginDesginMode) { isOk = true; }
                                }
                                if (isOk)
                                {
                                    DataRow tr = FaceDt.NewRow();
                                    tr["Tag"] = temp[1];
                                    tr["Path"] = FaceFile.FullName.ToLower().Replace(".cs", "");
                                    tr["Range"] = range;
                                    FaceDt.Rows.Add(tr);
                                }

                            }


                        }
                    }
                }
            }
        }

        if (FaceDt.Rows.Count > 0)
        {
            FaceDt.DefaultView.Sort = "Range ASC";
            FaceDt = FaceDt.DefaultView.ToTable();
            int startIndex = 200;
            int f = startIndex;
            foreach (DataRow row in FaceDt.DefaultView.Table.Rows)
            {
                try
                {

                    if (f == startIndex)
                    {
                        PlaceHolder1.Controls.Add(new LiteralControl("<li class=\"active\"><a data-toggle=\"tab\" href=\"#tab" + f.ToString() + "\">" + ValString(row["Tag"]) + "</a></li>"));
                        PlaceHolder2.Controls.Add(new LiteralControl("<div class=\"tab-pane form-group active\" id=\"tab" + f.ToString() + "\">"));
                    }
                    else
                    {
                        PlaceHolder1.Controls.Add(new LiteralControl("<li><a data-toggle=\"tab\" href=\"#tab" + f.ToString() + "\">" + ValString(row["Tag"]) + "</a></li>"));
                        PlaceHolder2.Controls.Add(new LiteralControl("<div class=\"tab-pane form-group\" id=\"tab" + f.ToString() + "\">"));
                    }

                    string VirtualPath = "~/admin/" + Split(ValString(row["Path"]), "\\admin\\")[1];
                    Control ctlNew = this.Page.LoadControl(VirtualPath);
                    ctlNew.ID = "ConfigExUC_" + f.ToString();
                    PlaceHolder2.Controls.Add(ctlNew);
                    PlaceHolder2.Controls.Add(new LiteralControl("</div>"));

                    ((ConfigExtendUC)PlaceHolder2.FindControl(ctlNew.ID)).GetMode(loginInfo.isLoginDesginMode);

                    f++;

                }
                catch (Exception ex)
                {
                    //Response.Write(ex.Message);
                }
            }
        }


    }


    #endregion

    #region 備份

    protected void BackupList()
    {
        if (BackupPanel.Visible)
        {
            ez.admin.backup backup = new ez.admin.backup();
            List<ez.admin.backup.DataInfo> dt = backup.List();
            BackupHistory.Items.Clear();
            if (dt.Count > 0)
            {
                foreach (ez.admin.backup.DataInfo row in dt)
                {
                    BackupHistory.Items.Add(new ListItem(row.Time, row.FullName));
                }
            }
        }
    }

    protected void RunBackup_Click(object sender, EventArgs e)
    {
        BackupMsg.Text = "";
        int BackupLimit = 50; //備份上限50個

        if (BackupHistory.Items.Count < BackupLimit)
        {
            ez.admin.backup backup = new ez.admin.backup();
            if (backup.Execute())
            {
                ScriptMsgAjax("備份成功");
                BackupList();
            }
            else
            {
                BackupMsg.Text = backup.log;
            }
        }
        else
        {
            ScriptMsgAjax("很抱歉，您最多只能備份50個，請刪除較久之前的備份檔！");
        }

    }

    protected void RestoreBackup_Click(object sender, EventArgs e)
    {
        List<string> RestorePath = new List<string>();
        foreach (ListItem item in BackupHistory.Items)
        {
            if (item.Selected) { RestorePath.Add(item.Value); }
        }
        if (RestorePath.Count == 0) { ScriptMsgAjax("請勾選要還原的時間"); }
        else if (RestorePath.Count != 1) { ScriptMsgAjax("只能勾選一個還原的時間"); }
        else
        {
            ez.admin.backup backup = new ez.admin.backup();
            if (backup.Restore(RestorePath[0]))
            {
                ScriptMsgAjax("還原成功");
            }
            else
            {
                BackupMsg.Text = backup.log;
            }
        }
    }


    protected void DelBackup_Click(object sender, EventArgs e)
    {
        List<string> DelPath = new List<string>();
        foreach (ListItem item in BackupHistory.Items)
        {
            if (item.Selected) { DelPath.Add(item.Value); }
        }
        if (DelPath.Count == 0) { ScriptMsgAjax("請勾選要刪除的時間"); }
        else
        {
            ez.admin.backup backup = new ez.admin.backup();
            if (backup.Del(DelPath.ToArray()))
            {
                ScriptMsgAjax("刪除成功");
                BackupList();
            }
            else
            {
                BackupMsg.Text = backup.log;
            }
        }
    }

    #endregion

    #region 寄信測試

    protected void mailsend_Click(object sender, EventArgs e)
    {
        mailtest.ForeColor = System.Drawing.Color.Red;
        mailtest.Text = "";

        ez.sql sql = new ez.sql();
        string column = "com_mail,bcc_mail,smtp_url,smtp_port,smtp_user,smtp_password,smtp_ssl";

        string sqlQuery = "update company set " + sql.mark2(column);
        ArrayList OleDbParameters = new ArrayList();
        OleDbParameters.Add(new OleDbParameter("com_mail", com_mail.Value.Trim()));
        OleDbParameters.Add(new OleDbParameter("bcc_mail", bcc_mail.Text.Trim()));
        OleDbParameters.Add(new OleDbParameter("smtp_url", smtp_url.Value.Trim()));
        OleDbParameters.Add(new OleDbParameter("smtp_port", smtp_port.Value.Trim()));
        OleDbParameters.Add(new OleDbParameter("smtp_user", smtp_user.Value.Trim()));
        OleDbParameters.Add(new OleDbParameter("smtp_password", (isStrNull(smtp_password.Text) ? "" : Base64Encode(smtp_password.Text))));
        OleDbParameters.Add(new OleDbParameter("smtp_ssl", (smtp_ssl.Checked ? "Y" : "N")));

        if (sql.execute(sqlQuery, OleDbParameters))
        {
            HttpContext.Current.Application.Lock();
            HttpContext.Current.Application[SC + "WebInfo"] = null;
            HttpContext.Current.Application.UnLock();

            //儲存通用擴充設定
            List<ez.data.configExtend.SetOption> SetOptions = new List<ez.data.configExtend.SetOption>();
            ez.data.configExtend.SetOption Option = new ez.data.configExtend.SetOption();
            Option.parameter = "UseDefaultCredentials";
            Option.data = UseDefaultCredentials.SelectedValue;
            SetOptions.Add(Option);
            ez.data.configExtend c = new ez.data.configExtend(category);
            c.SaveSetView(SetOptions);

            //發信測試
            ez.mailSystem mailSystem = new ez.mailSystem();
            ez.mailSystem.DataInfo mailData = new ez.mailSystem.DataInfo();
            mailData.toMail = com_mail.Value.Trim();
            mailData.subject = "寄信測試";
            mailData.word = "如果您收到這封信代表您的設定正確且成功了！";
            mailSystem.Data = mailData;
            if (mailSystem.send())
            {
                mailtest.ForeColor = System.Drawing.Color.Green;
                mailtest.Text = "發送成功";
                ScriptMsg("發送成功", Request.Url.AbsoluteUri);
            }
            else
            {
                mailtest.Text = mailSystem.log;
            }
        }
        else
        {
            mailtest.Text = sql.log;
        }

    }

    #endregion

    #region 還原成初始(給測試區用的) 僅限設計師模式

    protected void initRecovery()
    {
        if (loginInfo.isLoginDesginMode)
        {
            FileInfo finfo1 = new FileInfo(Server.MapPath("~/_recovery/clear.sql"));
            FileInfo finfo2 = new FileInfo(Server.MapPath("~/_recovery/db.sql"));
            recoveryPanel.Visible = (finfo1.Exists && finfo2.Exists ? true : false);
        }
    }

    protected void recoveryBtn_Click(object sender, EventArgs e)
    {
        recover_msg.Text = "";

        try
        {
            FileInfo finfo1 = new FileInfo(Server.MapPath("~/_recovery/clear.sql"));
            FileInfo finfo2 = new FileInfo(Server.MapPath("~/_recovery/db.sql"));
            if (finfo1.Exists && finfo2.Exists)
            {
                ez.sql sql = new ez.sql();
                if (sql.db.IndexOf(TEST_SQL_IP) > -1)
                {
                    if (sql.execute(GetFileDataStr("~/_recovery/clear.sql")))
                    {
                        if (sql.execute(GetFileDataStr("~/_recovery/db.sql")))
                        {
                            DirectoryInfo[] dinfos = new DirectoryInfo(Server.MapPath("~/_recovery")).GetDirectories();
                            if (dinfos.Length > 0)
                            {
                                foreach (DirectoryInfo dinfo in dinfos)
                                {
                                    DirectoryInfo orgDir = new DirectoryInfo(Server.MapPath("~/" + dinfo.Name));
                                    if (orgDir.Exists)
                                    {
                                        orgDir.Delete(true);
                                        while (orgDir.Exists)
                                        {
                                            Thread.Sleep(500);
                                            orgDir.Refresh();
                                        }
                                    }
                                }
                                foreach (DirectoryInfo dinfo in dinfos)
                                {
                                    DirectoryCopy(dinfo.FullName, Server.MapPath("~/" + dinfo.Name));
                                }
                            }

                            recover_msg.Text = "還原初始成功";
                        }
                        else
                        {
                            recover_msg.Text = sql.log;
                        }
                    }
                    else
                    {
                        recover_msg.Text = sql.log;
                    }
                }
                else
                {
                    recover_msg.Text = "您的資料庫連線不是供試用區使用，請洽系統管理員！";
                }


            }
        }
        catch (Exception ex)
        {
            recover_msg.Text = ex.Message;
        }


    }

    private static void DirectoryCopy(string sourceDirName, string destDirName, bool copySubDirs = true)
    {
        DirectoryInfo dir = new DirectoryInfo(sourceDirName);
        if (dir.Exists)
        {
            DirectoryInfo[] dirs = dir.GetDirectories();
            if (!Directory.Exists(destDirName))
            {
                Directory.CreateDirectory(destDirName);
            }
            FileInfo[] files = dir.GetFiles();
            foreach (FileInfo file in files)
            {
                string temppath = Path.Combine(destDirName, file.Name);
                file.CopyTo(temppath, true);
            }
            if (copySubDirs)
            {
                foreach (DirectoryInfo subdir in dirs)
                {
                    string temppath = Path.Combine(destDirName, subdir.Name);
                    DirectoryCopy(subdir.FullName, temppath, copySubDirs);
                }
            }
        }

    }

    protected string GetFileDataStr(string path)
    {
        string str = "";
        Stream stream = File.Open(Server.MapPath(path), FileMode.Open, FileAccess.Read, FileShare.Read);
        StreamReader objReader = new StreamReader(stream);
        while (!objReader.EndOfStream)
        {
            str += objReader.ReadLine() + "\n";
        }
        objReader.Close();
        objReader.Dispose();
        stream.Close();
        stream.Dispose();
        return str;
    }

    #endregion


}