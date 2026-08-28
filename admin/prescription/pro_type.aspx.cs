using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using System.Data.OleDb;
using System.Collections;
using ez.data;

public partial class admin_pro_type : ez.admin.PageBase
{
    prescription.company company = new prescription.company();
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            if (!isStrNull(Request["pro_id"]))
            {
                prescription prescription = new prescription();
                if (prescription.Load(Val(Request["pro_id"])))
                {
                    prescription.DataInfo info = prescription.Data;
                    nation.Value = info.nation;
                    pro_name.Text = "<strong>" + info.pro_name + "</strong>";
                }
            }

            string[] nq = { "num", "pro_id" };
            ViewState["UrlQuery"] = rtnQueryString(nq).Replace("?", "&");

            goback1.NavigateUrl = "reg.aspx?num=" + Request["pro_id"].ToString() + ViewState["UrlQuery"].ToString();
            goback2.NavigateUrl = "index.aspx" + rtnQueryString(nq);

            BuildTreeView();

            //展開項目
            if (!isStrNull(Request["num"]))
            {
                formPanel.Visible = true;
                formPanel.Enabled = true;


                //載入資料        
                if (company.Load(Val(Request["num"])))
                {
                    mode.Value = "edit";

                    prescription.company.DataInfo info = company.Data;
                    kind.Value = info.kind;
                    pro_num.Value = info.pro_num;
                    if (info.rated.HasValue) { rated.Value = info.rated.Value.ToString(); }
                    if (info.electricity.HasValue) { electricity.Value = info.electricity.Value.ToString(); }
                    range.Value = info.range.ToString();
                    if (company.picMax > 0) { picInit(info.pic); }

                    del.Visible = true;
                    HiddenField1.Value = info.kind;
                }
                else
                {
                    msg.Text = company.log;
                    formPanel.Enabled = false;
                }

            }
        }

    }

    #region 產生TreeView選單

    public void BuildTreeView()
    {
        this.TreeView1.Nodes.Clear();
        BuildChild(0, this.TreeView1.Nodes, 1);
    }

    public void BuildChild(int RootUid, TreeNodeCollection Nodes, int level)
    {
        bool isLastLevel = (level + 1 > company.LevelMax);

        ArrayList Rows = company.RowData(RootUid, Val(Request["pro_id"]));

        foreach (prescription.company.DataInfo info in Rows)
        {

            TreeNode newNode = new TreeNode();


            if (Val(Request["num"]) == info.num)
            {
                newNode.Text = "<b><span style=\"color:blue\">" + info.kind + "</span></b>";
                if (!isLastLevel)
                {
                    addSubOption.Visible = true;
                }

            }
            else
            {
                newNode.Text = info.kind;
            }
            newNode.Value = info.num.ToString();
            newNode.NavigateUrl = Request.Url.AbsolutePath + "?num=" + info.num.ToString() + "&pro_id=" + Request["pro_id"].ToString() + ViewState["UrlQuery"].ToString();
            newNode.Expand();
            Nodes.Add(newNode);
            if (!isLastLevel)
            {
                BuildChild(info.num, newNode.ChildNodes, level + 1);
            }

        }


    }

    #endregion


    #region 表單預設

    void defForm()
    {
        kind.Value = "";
        pro_num.Value = "";
        rated.Value = "";
        electricity.Value = "";
        mode.Value = "";
        msg.Text = "";
        addSubOption.Visible = false;
        del.Visible = false;
        if (company.picMax > 0)
        {
            string[] pic = new string[company.picMax];
            picInit(pic);
        }
    }

    #endregion

    #region 建立選項

    protected void addRootOption_Click(object sender, EventArgs e)
    {
        defForm();  //初始化
        formPanel.Visible = true;
        mode.Value = "addRoot";
        Literal1.Text = "建立電器推薦";
        navDiv.Visible = true;
        range.Value = company.NewRange(0, Val(Request["pro_id"])).ToString();
    }

    protected void addSubOption_Click(object sender, EventArgs e)
    {
        defForm();  //初始化
        mode.Value = "addSub";
        Literal1.Text = "於「" + HiddenField1.Value + "」底下建立次電器推薦";
        navDiv.Visible = true;
        range.Value = company.NewRange(Val(Request["num"]), Val(Request["pro_id"])).ToString();
    }

    #endregion

    #region 新增/修改資料

    protected void submitButton_Click(object sender, EventArgs e)
    {
        if (Page.IsValid)
        {
            msg.Text = "";

            prescription.company.DataInfo info = new prescription.company.DataInfo();

            //圖片處理=====
            string[] pic = new string[1];
            if (company.picMax > 0)
            {
                ez.fileSystem fileSystem = new ez.fileSystem();
                string[] pic_name = fileSystem.UploadPhoto(company.Dir, 800);
                pic = new string[company.picMax];
                for (int i = 0; i < company.picMax; i++)
                {
                    HiddenField orgPic = (HiddenField)picRepeater.Items[i].FindControl("pic");  //目前已存在的檔案
                    CheckBox orgDel = (CheckBox)picRepeater.Items[i].FindControl("delpic");  //是否要刪除
                    pic[i] = orgPic.Value;
                    string delFile = "";
                    if (!isStrNull(pic_name[i]))
                    { pic[i] = pic_name[i]; delFile = orgPic.Value; }
                    else if (orgDel.Checked)
                    { pic[i] = ""; delFile = orgPic.Value; }
                    if (!isStrNull(delFile)) { fileSystem.Delete(company.Dir + delFile); }  //刪除舊檔
                }
            }

            info.kind = kind.Value.Trim();
            info.pro_num = pro_num.Value.Trim();
            if (IsNumeric(rated.Value)) { info.rated = ValFloat(rated.Value); }
            if (IsNumeric(electricity.Value)) { info.electricity = ValFloat(electricity.Value); }
            info.pro_id = Val(Request["pro_id"]);
            info.nation = nation.Value;
            info.range = Val(range.Value);
            info.pic = pic;

            bool subOption = addSubOption.Visible;

            if (mode.Value == "addRoot")
            {
                info.root = 0;
                company.Data = info;
                if (company.Add()) { if (company.picMax > 0) { picInit(info.pic); } msg.Text = "新增成功"; BuildTreeView(); }
                else { msg.Text = company.log; }
            }
            else if (mode.Value == "addSub")
            {
                info.root = Val(Request["num"]);
                company.Data = info;
                if (company.Add()) { if (company.picMax > 0) { picInit(info.pic); } msg.Text = "新增成功"; BuildTreeView(); }
                else { msg.Text = company.log; }
            }
            else if (mode.Value == "edit")
            {
                info.num = Val(Request["num"]);
                company.Data = info;
                if (company.Edit()) { if (company.picMax > 0) { picInit(info.pic); } msg.Text = "修改成功"; BuildTreeView(); }
                else { msg.Text = company.log; }
            }

            addSubOption.Visible = subOption;

        }
    }

    #endregion

    #region 刪除

    protected void del_Click(object sender, EventArgs e)
    {
        if (company.Del(Val(Request["num"])))
        {
            Response.Redirect(Request.Url.AbsolutePath + rtnQueryString("num"));
        }
        else
        {
            msg.Text = company.log;
        }
    }

    protected void ClearButton_Click(object sender, EventArgs e)
    {

        company.Clear(Val(Request["pro_id"]));
        Response.Redirect(Request.Url.AbsolutePath + rtnQueryString("num"));
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
    }

    protected void picRepeater_ItemDataBound(object sender, RepeaterItemEventArgs e)
    {
        DataRowView row = (DataRowView)e.Item.DataItem;
        if (!isStrNull(row["pic"]))
        {
            ((CheckBox)e.Item.FindControl("delpic")).Visible = true;
            ((HyperLink)e.Item.FindControl("HyperLink1")).Visible = true;
            ((HyperLink)e.Item.FindControl("HyperLink1")).NavigateUrl = company.Dir + row["pic"].ToString();
            ((Image)e.Item.FindControl("Image1")).ImageUrl = company.Dir + row["pic"].ToString();
        }
    }

    #endregion


}