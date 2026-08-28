using ez.data;
using System;
using System.Collections.Generic;
using System.Data;
using System.Web.UI;
using System.Web.UI.WebControls;

public partial class admin_pro_reg : ez.admin.PageBase
{
    region region = new region();
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            prescription prescription = new prescription();

            ez.language lan = new ez.language();
            if (lan.Load())
            {
                lan.InitOptions(nation, nationPanel);
            }

            prescription.initStatusOptions(status);
            if (status.Items.Count > 0) { status.SelectedIndex = 0; }

            app.Items.Clear();
            app.Items.Add(new ListItem("", ""));
            prescription.initAppliancesOptions(app);

            if (!isStrNull(Request["num"]))
            {
                if (prescription.Load(Val(Request["num"])))
                {
                    mode.Value = "edit";
                    prescription.DataInfo info = prescription.Data;
                    nation.SelectedValue = info.nation;
                    app.SelectedValue = info.pro_name;
                    description.Value = info.description;
                    word.Text = info.word;
                    word2.Text = info.word2;
                    word3.Text = info.word3;
                    if (info.kwh.HasValue) { kwh.Value = info.kwh.Value.ToString(); }
                    status.SelectedValue = info.status;
                    picInit(info.pic);
                }
                else
                {
                    Response.Write(prescription.log);
                    ScriptMsg("查無資料", "index.aspx" + rtnQueryString("num"));
                }
                goBack.Visible = true;
                goBack.NavigateUrl = "index.aspx" + rtnQueryString("num");

            }
            else
            {
                mode.Value = "add";
                string[] pic = new string[prescription.picMax];
                picInit(pic);
            }
        }

    }

    #region 分類/語系

    protected void nation_SelectedIndexChanged(object sender, EventArgs e)
    {

    }

    #endregion

    #region 圖片

    protected void picInit(string[] pic)
    {
        DataTable picDt = new DataTable();
        picDt.Columns.Add("row");
        picDt.Columns.Add("pic");
        for (int i = 0; i < pic.Length; i++)
        {
            DataRow tr = picDt.NewRow();
            tr["row"] = i + 1;
            tr["pic"] = (!isStrNull(pic[i]) ? pic[i] : "");
            picDt.Rows.Add(tr);
        }
        picRepeater.DataSource = picDt;
        picRepeater.DataBind();
        if (picDt.Rows.Count == 0) { picPanel.Visible = false; }
    }

    protected void picRepeater_ItemDataBound(object sender, RepeaterItemEventArgs e)
    {
        DataRowView row = (DataRowView)e.Item.DataItem;
        if (!isStrNull(row["pic"]))
        {
            prescription prescription = new prescription();
            ((CheckBox)e.Item.FindControl("delpic")).Visible = true;
            ((HyperLink)e.Item.FindControl("HyperLink1")).Visible = true;
            ((HyperLink)e.Item.FindControl("HyperLink1")).NavigateUrl = prescription.Dir + row["pic"].ToString();
            ((Image)e.Item.FindControl("Image1")).ImageUrl = prescription.Dir + row["pic"].ToString();
        }


    }

    #endregion

    #region 新增/修改資料

    protected void submitButton_Click(object sender, EventArgs e)
    {
        if (Page.IsValid)
        {

            msg.Text = "";

            //圖片處理=====
            string[] pic = new string[1];
            prescription prescription = new prescription();
            if (prescription.picMax > 0)
            {
                ez.fileSystem fileSystem = new ez.fileSystem();
                string[] pic_name = fileSystem.UploadPhoto(prescription.Dir, 1024);
                pic = new string[prescription.picMax];
                for (int i = 0; i < prescription.picMax; i++)
                {
                    HiddenField orgPic = (HiddenField)picRepeater.Items[i].FindControl("pic");  //目前已存在的檔案
                    CheckBox orgDel = (CheckBox)picRepeater.Items[i].FindControl("delpic");  //是否要刪除
                    pic[i] = orgPic.Value;
                    string delFile = "";
                    if (!isStrNull(pic_name[i]))
                    { pic[i] = pic_name[i]; delFile = orgPic.Value; }
                    else if (orgDel.Checked)
                    { pic[i] = ""; delFile = orgPic.Value; }
                    if (!isStrNull(delFile) && !isStrNull(Request["num"]))
                    {
                        if (!prescription.picIsUse(delFile, Val(Request["num"]))) { fileSystem.Delete(prescription.Dir + delFile); }//刪除舊檔          
                    }
                }
            }


            //寫入資料====-
            prescription.DataInfo info = new prescription.DataInfo();
            info.nation = nation.SelectedValue;
            info.pro_name = app.SelectedValue;
            info.description = description.Value.Trim(); 
            info.word = word.Text;
            info.word2 = word2.Text;
            info.word3 = word3.Text;
            if (IsNumeric(kwh.Value)) { info.kwh = Val(kwh.Value); }
            info.status = status.SelectedValue;
            info.pic = pic;

            switch (mode.Value)
            {
                case "add":
                    prescription.Data = info;
                    if (prescription.Add())
                    {
                        Response.Redirect("index.aspx");
                    }
                    else { msg.Text = prescription.log; }
                    break;
                case "edit":
                    info.num = Val(Request["num"]);
                    prescription.Data = info;
                    if (prescription.Edit())
                    {
                        Response.Redirect("index.aspx" + rtnQueryString("num"));
                    }
                    else { msg.Text = prescription.log; }
                    break;
                default:
                    break;
            }

        }
    }

    #endregion




}