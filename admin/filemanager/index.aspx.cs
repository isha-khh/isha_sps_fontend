using System;
using System.Collections.Generic;
using System.Configuration;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using System.IO;

public partial class admin_filemanager_index :ez.function
{
       
    protected void Page_Load(object sender, EventArgs e)
    {
        if (ez.admin.PageBase.chkAdmIP && (ez.admin.PageBase.chkTwIP || ez.admin.PageBase.chkAdmIP_Enable))
        {
            ez.admin.user chkuser = new ez.admin.user();
            if (chkuser.isLogin())
            {
                if (!IsPostBack)
                {

                    if ((Request.Cookies[SC + "_ezFileSort"] != null))
                    {
                        sortWay.SelectedValue = Request.Cookies[SC + "_ezFileSort"].Value;
                    }
                    saveSort(false);

                    if (ckeditorDir.Substring(0, 1) == "/") { ckeditorDir = ckeditorDir.Substring(1, ckeditorDir.Length - 1); }

                    //定義初始路徑
                    ViewState["root_path"] = "../../" + ckeditorDir;

                    //參數，如有需要增加，請接續後面
                    ViewState["QueryString"] = "&CKEditorFuncNum=" + ValString(Request["CKEditorFuncNum"]) + "&rtnobj=" + ValString(Request["rtnobj"]) + "&CKEditor=" + ValString(Request["CKEditor"]) + "&langCode=" + ValString(Request["langCode"]);

                    //絕對路徑
                    ez.data.info WebSet = new ez.data.info();
                    WebSet.Load();
                    string http_path = WebSet.Data.url;

                    //相對路徑
                    //string http_path = "../../";

                    if (http_path.Substring(http_path.Length - 1, 1).ToString() != "/") { http_path = http_path + "/"; }
                    ViewState["http_path"] = http_path + ckeditorDir; //定義上傳圖片實體路徑
                    ViewState["total_bytes"] = 0; //定義總檔案大小初始值

                    if (!isStrNull(Request["kw"]))
                    {
                        search.Text = Request["kw"];
                    }

                    if (ValString(Request["mode"]) == "upload")
                    {
                        MultiView1.ActiveViewIndex = 1;
                        L_path.Text = "";
                        Image2.Visible = false;
                        tr1.Visible = false;
                        Button2.Visible = true;

                        HttpBrowserCapabilities hbc = Request.Browser;
                        //Response.Write(hbc.Browser);                 
                        if (hbc.Browser.IndexOf("InternetExplorer") > -1 | hbc.Browser.ToUpper().IndexOf("IE") > -1)
                        {
                            ieUploadDiv.Visible = true;
                            iePlaceHolder.Visible = true;
                        }
                        else
                        {
                            otherUploadDiv.Visible = true;
                            otherPlaceHolder.Visible = true;
                        }

                    }
                    else
                    {
                        load_dir_files(); //檔案列表
                        Button2.Visible = false;
                    }


                }
            }
            else
            {
                Response.Clear();
                Response.StatusCode = 404;
                Response.End();
            }
        }
        else
        {
            Response.Clear();
            Response.StatusCode = 404;
            Response.End();
        }

       

    }

    #region 檔案列表

    public void load_dir_files() { 

        //計算總檔案大小
        //total_bytes("");

        DataTable dt = new DataTable("Dt1");
      
        //定義DataTable欄位名稱
        dt.Columns.Add(new DataColumn("filename"));
        dt.Columns.Add(new DataColumn("review"));
        dt.Columns.Add(new DataColumn("filesize"));
        dt.Columns.Add(new DataColumn("c_date"));
        dt.Columns.Add(new DataColumn("filename2"));
        dt.Columns.Add(new DataColumn("filekind"));
        dt.Columns.Add(new DataColumn("fileqty"));
        dt.Columns.Add(new DataColumn("isDir"));

        //取得目錄路徑
        string dirpath = "";
        string dirpath2 = "";
        string dirpath3 = "";
        string dirpath4 = "";

        if (ValString(Request["dirname"]) != "" & Request["dirname"]!=null)
        {
            
            dirpath = "/" + ValString(Request["dirname"]);
            dirpath4 = ValString(Request["dirname"]) + "/";
            string[] v = ValString(Request["dirname"]).Split('/');
            for (int ii = 0; ii < v.Length; ii++) {
                if (dirpath2 != "")
                {
                    dirpath2 += "/" + v[ii];
                    if (ii == v.Length - 1)
                    {
                        dirpath3 += "/" + v[ii];
                    }
                    else {
                        dirpath3 += "/<a href='index.aspx?dirname=" + HttpUtility.UrlEncode(dirpath2) + ViewState["QueryString"].ToString() + "'>" + HttpUtility.HtmlEncode(v[ii]) + "</a>";
                    }
                }
                else {
                    dirpath2 += v[ii];
                    if (ii == v.Length - 1)
                    {
                        dirpath3 += v[ii];
                    }
                    else {
                        dirpath3 += "<a href='index.aspx?dirname=" + HttpUtility.UrlEncode(dirpath2) + ViewState["QueryString"].ToString() + "'>" + HttpUtility.HtmlEncode(v[ii]) + "</a>";
                    }
                }
            }
            L_path.Text = "<a href='index.aspx" + ViewState["QueryString"].ToString().Replace("&CKEditorFuncNum=", "?CKEditorFuncNum=") + "'>根目錄</a>/" + dirpath3;
        }
        else {
            dirpath = "";
            dirpath4 = "";
            L_path.Text = "";
            Image2.Visible = false;
            tr1.Visible = false;
        }

         string kw ="";
         if (!isStrNull(Request["kw"]))
         {
             kw = Request["kw"];
         }
       
        //定義資料
        string path = Server.MapPath(ViewState["root_path"].ToString() + dirpath);
        DirectoryInfo dirInfo= new DirectoryInfo(path);
        DirectoryInfo[] subDirs = dirInfo.GetDirectories();
        FileInfo[] subFiles = dirInfo.GetFiles();
     
        //將資料夾名稱填入DataTable
        string child_dirinfo = "";
        string new_dir = "";
        for (int i = 0; i < subDirs.Length; i++) {

            bool chkSearch = true;
            if (kw != "")
            {
                if (subDirs[i].Name.ToLower().IndexOf(kw.ToLower()) == -1)
                {
                    chkSearch = false;
                }
            }
            if (chkSearch)
            {

                //取得子資料夾資訊
                string path2 = Server.MapPath(ViewState["root_path"].ToString() + dirpath + "/" + subDirs[i].Name);
                DirectoryInfo dirInfo2 = new DirectoryInfo(path2);
                DirectoryInfo[] subDirs2 = dirInfo2.GetDirectories();
                FileInfo[] subFiles2 = dirInfo2.GetFiles();

                child_dirinfo = "內有 <span style=\"color:red\">" + subDirs2.Length.ToString() + "</span> 資料夾<br><span style=\"color:red\">" + subFiles2.Length + "</span> 個檔案";
                string fileqty = "";
                string filekind = "";

                filekind = "A";
                fileqty = "B";
                bool chkAgin = true;
                //upload的目錄下
                if (dirpath == "")
                {
                    //foreach (string chkDir in systemDirs)
                    //{
                    //    if (subDirs[i].Name.ToLower() == chkDir.ToLower())
                    //    {
                    //        filekind = "C";
                    //        fileqty = "B";
                    //        chkAgin = false;
                    //        break;
                    //    }
                    //}
                }
                if (chkAgin & subDirs2.Length == 0 & subFiles2.Length == 0)
                {
                    filekind = "A";
                    fileqty = "A";
                }


                if (ValString(Request["dirname"]) != "" & Request["dirname"] != null)
                {
                    new_dir = Request["dirname"] + "/" + subDirs[i].Name;
                }
                else
                {
                    new_dir = subDirs[i].Name;
                }

                string subfilename = "<span title=\"" + HttpUtility.HtmlEncode(subDirs[i].Name) + "\">" + HttpUtility.HtmlEncode(subDirs[i].Name) + "</span>";
                string review_file = "<a href=\"index.aspx?dirname=" + HttpUtility.UrlEncode(new_dir) + ViewState["QueryString"].ToString() + "\" title=\"" + HttpUtility.HtmlEncode(subDirs[i].Name) + "\"><img src=\"images/dir.png\" border=\"0\" width=\"100\" /></a>";

                dt.Rows.Add(subfilename, review_file, child_dirinfo, subDirs[i].LastWriteTime.ToString("yyyyMMddHHmmssfff"), subDirs[i].Name, filekind, fileqty, 1);
           
            }
        }


        dirTotal.Text = subDirs.Length.ToString();
        //將檔案名稱填入DataTable

        for (int j = 0; j < subFiles.Length; j++)
        {

            bool chkSearch = true;
            if (kw != "")
            {
                if (subFiles[j].Name.ToLower().IndexOf(kw.ToLower()) == -1)
                {
                    chkSearch = false;
                }
            }
            if (chkSearch)
            {

                string[] tmp = subFiles[j].Name.Split('.');
                string fileSubName = tmp[tmp.Length - 1].ToLower();
                string viewPic = "";
                if (fileSubName == "jpg" | fileSubName == "jepg" | fileSubName == "gif" | fileSubName == "png")
                {
                    viewPic = "<img src=\"../../App_Script/display.ashx?rootDir=" + ckeditorDir +  "&file=" + dirpath4 + subFiles[j].Name + "&w=120&h=120\" border=\"0\" />";
                }
                else
                {
                    viewPic = "<img src=\"images/" + picLog(fileSubName) + ".png\" border=\"0\" />";
                }

                string subfilename = "<span title=\"" + HttpUtility.HtmlEncode(subFiles[j].Name) + "\">" + HttpUtility.HtmlEncode(subFiles[j].Name) + "</span>";
                string review_file = "<a href=\"#\" title=\"" + HttpUtility.HtmlEncode(subFiles[j].Name) + "\" onclick=\"OpenFile('" + ViewState["http_path"] + dirpath4 + HttpUtility.UrlEncode(subFiles[j].Name) + "');return false;\">" + viewPic + "</a>";
                dt.Rows.Add(subfilename, review_file, (subFiles[j].Length / 1024).ToString("0.00") + " KB", subFiles[j].LastWriteTime.ToString("yyyyMMddHHmmssfff"), subFiles[j].Name, "B", "X", 0);

            }           
        }

        total.Text = subFiles.Length.ToString();

        dt.DefaultView.Sort = "isDir desc, " + sortWay.SelectedValue.Replace("$", " ");

        PagedDataSource objPage = new PagedDataSource();
        objPage.DataSource = dt.DefaultView;
        objPage.AllowPaging = true;
        objPage.PageSize = 12;
        int CurPage = 1;
        if (Request["page"]!=null)
        {
            CurPage = Val(Request["page"]);            
        }
        if (CurPage > objPage.PageCount) 
        {
            CurPage = objPage.PageCount;
        }
        objPage.CurrentPageIndex = CurPage - 1;
        
        for (int i = 1; i <= objPage.PageCount; i++) {
            nowpage.Items.Add(i.ToString());
        }

        if (nowpage.Items.Count > 0) {
            nowpage.SelectedValue = CurPage.ToString(); //顯示目前第幾頁
        }

        maxpage.Text = objPage.PageCount.ToString();  //顯示最大頁數

        Repeater1.DataSource = objPage;
        Repeater1.DataBind();
    }


    protected void Repeater1_ItemDataBound(object sender, RepeaterItemEventArgs e)
    {
        DataRowView data = (DataRowView)e.Item.DataItem;

        if (e.Item.ItemIndex % 4 == 3) {
            Panel splitDiv = (Panel)e.Item.FindControl("splitDiv");
            splitDiv.Visible = true;
        }

        CheckBox CheckBox1 = (CheckBox)e.Item.FindControl("CheckBox1");
        if (data["filekind"].ToString() == "B" | (data["filekind"].ToString() == "A" & data["fileqty"].ToString() == "A"))
        {
            CheckBox1.Visible = true;
        }

        HiddenField filekind = (HiddenField)e.Item.FindControl("filekind");
        filekind.Value = data["filekind"].ToString();

    }

    public string picLog(string subName){
        string rtn = "|ai|asp|aspx|js|jsp|pdf|php|psd|swf|txt|";
        if (rtn.IndexOf("|" + subName + "|", 0) > -1)
        {
            return subName;
        }
        else if (subName == "xls" | subName == "xlsx")
        {
            return "excel";
        }
        else if (subName == "doc" | subName == "docx")
        {
            return "word";
        }
        else if (subName == "zip" | subName == "rar")
        {
            return "zip";
        }
        else if (subName == "htm" | subName == "html")
        {
            return "html";
        }
        else if (subName == "ppt" | subName == "pps" | subName == "pptx" | subName == "ppsx")
        {
            return "powerpoint";
        }
        else if (subName == "bmp" | subName == "tif")
        {
            return "photo";
        }
        else if (subName == "wmv" | subName == "mp4" | subName == "rm" | subName == "mov")
        {
            return "video";
        }
        else
        {
            return "unknown";
        }        
    }

    protected void nowpage_SelectedIndexChanged(object sender, EventArgs e)
    {
        GoToPage(Val(nowpage.SelectedValue));
    }

    protected void LinkButton1_Click(object sender, EventArgs e)
    {
        int pg = Val(nowpage.SelectedValue);
        GoToPage((pg - 1 > 0 ? pg - 1 : 1));       
    }
    protected void LinkButton2_Click(object sender, EventArgs e)
    {
        int pg = Val(nowpage.SelectedValue);
        int maxpg = Val(maxpage.Text);
        GoToPage((pg + 1 <= maxpg ? pg + 1 : maxpg));         
    }

    public void GoToPage(int p) {
        string url = "index.aspx" + rtnQueryString("page");
        Response.Redirect(url + "&page=" + p.ToString());    
    }

    //計算目前總檔案大小
    public void total_bytes(string dirpath)
    {
        string path = Server.MapPath(ViewState["root_path"].ToString() + dirpath);
        DirectoryInfo dirInfo = new DirectoryInfo(path);
        DirectoryInfo[] subDirs = dirInfo.GetDirectories();
        FileInfo[] subFiles = dirInfo.GetFiles();
        long all_bytes = Convert.ToInt64(ViewState["total_bytes"]);
        for (int j = 0; j < subFiles.Length; j++)
        {
            all_bytes += subFiles[j].Length;
        }
        //Response.Write("路徑=" + dirpath + "<br>");
        //Response.Write("個別資料夾總和=" + (all_bytes / 1024).ToString("0.00") + "<br><br><br>");
        ViewState["total_bytes"] = all_bytes;
        for (int j = 0; j < subDirs.Length; j++)
        {
            total_bytes(dirpath + "/" + subDirs[j].Name);
        }
    }
   

    #endregion

    #region 刪除

    protected void ImageButton1_Click(object sender, ImageClickEventArgs e)
    {
        string[] v = ((ImageButton)sender).CommandArgument.Split('|');
        if (v[1] == "A") {
            string path = Server.MapPath(ValString(ViewState["root_path"]) + ValString(Request["dirname"]) + "/" + v[0]);
            DirectoryInfo DirectoryInfo = new DirectoryInfo(path);
            if (DirectoryInfo.Exists)
            {
                try
                {
                    DirectoryInfo.Delete();
                    Response.Redirect("index.aspx?dirname=" + ValString(Request["dirname"]) + ViewState["QueryString"].ToString());
                }
                catch (Exception)
                {
                    msg.Text = "(刪除失敗，因為要刪除資料夾不是空的！)";                   
                }
            }
            else {
                msg.Text = "(要刪除的資料夾：<font color=blue>" + v[0] + "</font> 不存在！！)";
            }
        }      
    }

    protected void dell_all_Click(object sender, ImageClickEventArgs e)
    {

        CheckBox cbox;
        ImageButton img;

        foreach (RepeaterItem item in Repeater1.Items)
        {

            cbox = (CheckBox)item.FindControl("CheckBox1");
            img = (ImageButton)item.FindControl("ImageButton1");
            string[] v = img.CommandArgument.Split('|');
            if (cbox.Checked) {

                string path = Server.MapPath(ValString(ViewState["root_path"]) + ValString(Request["dirname"]) + "/" + v[0]);
                HiddenField filekind = (HiddenField)item.FindControl("filekind");
                if (filekind.Value == "A")
                {
                    DirectoryInfo DirectoryInfo = new DirectoryInfo(path);
                    if (DirectoryInfo.Exists)
                    {
                        try
                        {
                            DirectoryInfo.Delete();
                        }
                        catch (Exception)
                        {
                            msg.Text = "(刪除失敗，因為要刪除資料夾不是空的！)";
                        }
                    }
                    else {
                        msg.Text = "(要刪除的資料夾：<font color=blue>" + v[0] + "</font> 不存在！！)";
                    }
                }
                else
                {
                    FileInfo FileInfo = new FileInfo(path);
                    if (FileInfo.Exists)
                    {
                        FileInfo.Delete();
                    }
                    else {
                        msg.Text = "(要刪除的檔案：<font color=blue>" + v[0] + "</font> 不存在！！)";
                    }
                }
                
            }
           
        }

        GoToPage(Val(nowpage.SelectedValue));
    }

    #endregion

    #region 建資料夾

    protected void creat_folder_Click(object sender, ImageClickEventArgs e)
    {
        string path = Server.MapPath(ValString(ViewState["root_path"]) + ValString(Request["dirname"]) + "/" + folder_name.Text);
        DirectoryInfo DirectoryInfo = new DirectoryInfo(path);
        if (DirectoryInfo.Exists)
        {
            msg.Text = "(資料夾名稱已存在，無法重覆新增！)";
        }
        else
        {
            DirectoryInfo.Create();
            Response.Redirect("index.aspx?dirname=" + ValString(Request["dirname"]) + ViewState["QueryString"].ToString());
        }
    }

    #endregion

    #region 上傳檔案

    protected void Button1_Click(object sender, ImageClickEventArgs e)
    {
        string up_path = Server.MapPath( ValString(ViewState["root_path"]) + ValString(Request["dirname"]));
        HttpFileCollection objFileCollection = Request.Files;
        HttpPostedFile file;
        int counter = 0;
        for (int i = 0; i < objFileCollection.Count; i++) {
            file = objFileCollection[i];
            if (file.ContentLength != null) {
                file.SaveAs(up_path + "/" + Path.GetFileName(file.FileName));
                counter++;
            }
        }

        if (counter == 0)
        {
            msg.Text = "(請選擇要上傳的檔案！)";
        }
        else 
        {
            msg.Text = "(上傳【" + counter.ToString() + "】個檔案成功！)";
            Response.Redirect("index.aspx?dirname=" + ValString(Request["dirname"]) + ViewState["QueryString"].ToString());
        }

    }

    #endregion

    #region 批次上傳

    protected void ImageButton2_Click(object sender, ImageClickEventArgs e)
    {
        ez.fileSystem fileSystem = new ez.fileSystem();
        if (fileSystem.CheckCountLimit())
        {
            string url = Request.Url.AbsoluteUri;
            if (url.IndexOf(".aspx?", 0) > -1)
            {
                url += "&mode=upload";
            }
            else
            {
                url += "?mode=upload";
            }
            Response.Redirect(url);
        }
        else
        {
            ScriptMsgAjax("您的磁碟容量已滿，請先刪除不必要的檔案");
        }     
    }

    protected void Button2_Click(object sender, EventArgs e)
    {
        string url = Request.Url.AbsoluteUri;
        url = url.Replace("&mode=upload", "");
        url = url.Replace("?mode=upload", "");
        string[] v = url.Split('?');
        if (v.Length == 0) {
            url = url.Replace("&CKEditorFuncNum=", "?CKEditorFuncNum=");
        }
        Response.Redirect(url);
    }
   
    #endregion

    #region 排序方式
    protected void sortWay_SelectedIndexChanged(object sender, EventArgs e)
    {
        saveSort(true);
    }
    protected void saveSort(bool refresh)
    {
        Response.Cookies[SC + "_ezFileSort"].Value = sortWay.SelectedValue;
        Response.Cookies[SC + "_ezFileSort"].Expires = Now().AddYears(1);
        if (refresh) {
            Response.Redirect(Request.Url.AbsoluteUri);
        }       
    }
    #endregion

    #region 搜尋

    protected void searchBt_Click(object sender, EventArgs e)
    {
        search.Text = search.Text.Trim();
        string kwStr = "";
        if (search.Text != "")
        {
            kwStr = "&kw=" + Server.UrlEncode(search.Text);
        }
        string[] q = { "kw", "page" };     
        Response.Redirect(Request.Url.AbsolutePath + rtnQueryString(q) + kwStr);
      
    }

    #endregion

}