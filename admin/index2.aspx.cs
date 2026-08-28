using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using System.Data.OleDb;
using ez.data;
using ez.admin;
using System.Xml;
using System.IO;


public partial class admin_index2 : ez.admin.PageBase //, MasterToAdminIndex2
{
    
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!Page.IsPostBack)
        {            
       
            ((BasePageToMaster)this.Page.Master).MasteBodyClass("home");       

            systemMessage();

            u_id.Text = loginInfo.ID;
            LoginTime.Text = loginInfo.LoginTime;
            LoginLastTime.Text = loginInfo.LoginLastTime;
      
            configuration.Modules cModules = new configuration.Modules();
            ModuleRepeater.DataSource = cModules.List();
            ModuleRepeater.DataBind();

            configuration configuration = new configuration();
            ezwebVersion.Text = configuration.Grade();   //取得等級
            
            initFaceplate();     //自動掛載系統面版

            //WRP NEWS
            supervisor supervisor = new supervisor();
            supervisor.Load(Val(loginInfo.Num));
            if (supervisor.Data.wrpNews == true) { wrpPanel.Visible = true; }


        }
    }

    
    #region 系統訊息

    protected void systemMessage()
    {
        if (Session[SC + "_ezAdmin_message"] != null)
        {
            ScriptMsg(ValString(Session[SC + "_ezAdmin_message"]));
            Session[SC + "_ezAdmin_message"] = null;
        }
    }

    #endregion

    #region WRP
    
    //public void setWrpInfo(string WrpApiUrl, string WrpApiClient)
    //{
    //   //info WebSet = new info();
    //   // WebSet.Load();
    //   // wrpEnable.Checked = WebSet.Data.wrpNews;

    //   // wrpApiUrl.Value = WrpApiUrl + WrpApiClient;
    //   // supervisor supervisor = new supervisor();
    //   // if (supervisor.Load(Val(loginInfo.Num), false))
    //   // {
    //   //     supervisor.DataInfo info = supervisor.Data;
    //   //     if (info.wrpNews.HasValue) { wrpEnable.Checked = (bool)info.wrpNews; }
    //   // }

    //   // wrpDiv.Visible = wrpEnable.Checked;

    //   // wrpNewsShow();
    //}

    //protected void wrpNewsShow()
    //{
    //    //wrpUl.Visible = false;
    //    //wrpMore.Visible = false;
    //    //try
    //    //{
    //    //    if (wrpEnable.Checked)
    //    //    {
    //    //        string xmlData = ReadPostFormContent(wrpApiUrl.Value, "host=" + Request.Url.Host);
    //    //        DataTable dt = XmDataTable(xmlData, "row");
    //    //        wrpRepeater.DataSource = dt;
    //    //        wrpRepeater.DataBind();
    //    //        wrpUl.Visible = true;
    //    //        dt = XmDataTable(xmlData, "more");
    //    //        if (dt.Rows.Count > 0)
    //    //        {
    //    //            wrpMore.Visible = true;
    //    //            wrpMore.NavigateUrl = dt.Rows[0]["link"].ToString();
    //    //        }
    //    //    }
    //    //}
    //    //catch (Exception)
    //    //{            
    //    //    //throw;
    //    //}    
    //}

    //protected void wrpEnable_CheckedChanged(object sender, EventArgs e)
    //{
    //    //wrpNewsShow();
    //    //supervisor supervisor = new supervisor();
    //    //if (supervisor.Load(Val(loginInfo.Num), false))
    //    //{
    //    //    supervisor.wrpNewsSet(Val(loginInfo.Num), wrpEnable.Checked);
    //    //}
    //}

    #endregion

    #region 動態掛載uc面版

    protected void initFaceplate()
    {

        DataTable FaceDt = new DataTable();
        FaceDt.Columns.Add("ID");
        FaceDt.Columns.Add("Path");
        FaceDt.Columns.Add("Power");
        FaceDt.Columns.Add("Range", typeof(int));

        DirectoryInfo UCDir = new DirectoryInfo(Server.MapPath("~/admin/uc/faceplate/"));   
        FileInfo[] FaceFiles = UCDir.GetFiles();
        if (FaceFiles.Length > 0)
        {
            int f = 0;
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
                            if (IsNumeric(temp[0]))
                            {
                                f++;
                                DataRow tr = FaceDt.NewRow();
                                tr["ID"] = "faceplate_" + f.ToString();
                                tr["Path"] = FaceFile.FullName.ToLower().Replace(".cs", "");
                                tr["Power"] = temp[1];
                                tr["Range"] = Val(temp[0]);
                                FaceDt.Rows.Add(tr);
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
                       
            foreach (DataRow row in FaceDt.DefaultView.Table.Rows)
            {           
                item item = new item();
                string[] powers = ValString(row["Power"]).Split(',');
                int isExist = 0;
                int isPower = 0;
                foreach (string power in powers)
                {
                    string num = item.numGet(power);
                    if (!isStrNull(num)) { isExist++; }
                    if (loginInfo.Group == "EZ" || ("," + loginInfo.Power + ",").IndexOf("," + num + ",") > -1) { isPower++; }
                }
                if (powers.Length == isExist && powers.Length == isPower)
                {
                    try
                    {
                        string VirtualPath = "~/admin/" + Split(ValString(row["Path"]), "\\admin\\")[1];
                        Control ctlNew = this.Page.LoadControl(VirtualPath);
                        ctlNew.ID = ValString(row["ID"]);
                        HomeAreaHolder.Controls.Add(ctlNew);
                    }
                    catch (Exception ex)
                    {
                        //Response.Write(ex.Message);
                    }
                }
            }
        }

    }

    #endregion


}