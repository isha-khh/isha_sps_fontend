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
using Microsoft.Ajax.Utilities;

public partial class admin_region_reg : ez.admin.PageBase
{
    region region = new region();
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {

            ez.language lan = new ez.language();
            if (lan.Load())
            {
                lan.InitOptions(nation, nationPanel);
                if (!isStrNull(Request["nation"])) { nation.SelectedValue = ValString(Request["nation"]); }
            }
            region.initAreaOptions(area);
            area.SelectedIndex = 0;
            region.initArea2Options(area2);
            area2.SelectedIndex = 0;

            //展開項目
            if (!isStrNull(Request["num"]))
            {
                formPanel.Visible = true;
                formPanel.Enabled = true;

                //載入資料        

                if (region.Load(Val(Request["num"])))
                {
                    mode.Value = "edit";

                    region.DataInfo info = region.Data;
                    if (info.area.HasValue) { area.SelectedValue = info.area.Value.ToString(); }
                    if (info.area2.HasValue) { area2.SelectedValue = info.area2.Value.ToString(); }
                    kind.Value = info.kind;
                    zip.Value = info.zip;
                    ViewState["root"] = ValString(info.root);
                    del.Visible = true;
                    HiddenField1.Value = info.kind;
                }
                else
                {
                    msg.Text = region.log;
                    formPanel.Enabled = false;
                }


            }

            BuildTreeView();


        }

    }

    protected void nation_SelectedIndexChanged(object sender, EventArgs e)
    {
        Response.Redirect(Request.Url.AbsolutePath + "?nation=" + nation.SelectedValue);
    }

    #region 產生TreeView選單

    public void BuildTreeView()
    {
        this.TreeView1.Nodes.Clear();
        BuildChild(0, this.TreeView1.Nodes, 1);
    }

    public void BuildChild(int RootUid, TreeNodeCollection Nodes, int level)
    {



        bool isLastLevel = (level + 1 > region.LevelMax);

        ArrayList Rows = region.RowData(RootUid, nation.SelectedValue);

        foreach (region.DataInfo info in Rows)
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
            newNode.NavigateUrl = Request.Url.AbsolutePath + "?num=" + info.num.ToString() + "&nation=" + nation.SelectedValue;

            bool expand = false;
            if (Val(Request["num"]) == info.num || Val(ViewState["root"]) == info.num) { expand = true; }
            newNode.Expanded = expand;

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
        zip.Value = "";
        mode.Value = "";
        msg.Text = "";
        addSubOption.Visible = false;
        del.Visible = false;
        area.SelectedIndex = 0;
        area2.SelectedIndex = 0;
    }

    #endregion

    #region 建立地區

    protected void addRootOption_Click(object sender, EventArgs e)
    {
        defForm();  //初始化
        formPanel.Visible = true;
        mode.Value = "addRoot";
        Literal1.Text = "建立主地區";
        navDiv.Visible = true;
    }

    protected void addSubOption_Click(object sender, EventArgs e)
    {
        defForm();  //初始化
        mode.Value = "addSub";
        Literal1.Text = "於「" + HiddenField1.Value + "」底下建立次地區";
        navDiv.Visible = true;
    }

    #endregion

    #region 新增/修改資料

    protected void submitButton_Click(object sender, EventArgs e)
    {
        if (Page.IsValid)
        {
            msg.Text = "";

            region region = new region();
            region.DataInfo info = new region.DataInfo();

            info.nation = nation.SelectedValue;
            info.kind = kind.Value.Trim();
            info.zip = zip.Value.Trim();
            if (!isStrNull(area.SelectedValue)) { info.area = Val(area.SelectedValue); }
            if (!isStrNull(area2.SelectedValue)) { info.area2 = Val(area2.SelectedValue); }
            
            bool subOption = addSubOption.Visible;

            if (mode.Value == "addRoot")
            {
                info.root = 0;
                region.Data = info;
                if (region.Add()) { msg.Text = "新增成功"; BuildTreeView(); }
                else { msg.Text = region.log; }
            }
            else if (mode.Value == "addSub")
            {
                info.root = Val(Request["num"]);
                region.Data = info;
                if (region.Add()) { msg.Text = "新增成功"; BuildTreeView(); }
                else { msg.Text = region.log; }
            }
            else if (mode.Value == "edit")
            {
                info.num = Val(Request["num"]);
                region.Data = info;
                if (region.Edit()) { msg.Text = "修改成功"; BuildTreeView(); }
                else { msg.Text = region.log; }
            }

            if (msg.Text.IndexOf("成功") > -1)
            {
                ScriptJS("msgtop('" + Server.HtmlEncode(msg.Text) + "','success')");
                msg.Text = "";
            }
            else if (!isStrNull(msg.Text))
            {
                ScriptJS("msgtop('操作失敗','error')");
            }

            addSubOption.Visible = subOption;

        }
    }

    #endregion

    #region 刪除

    protected void del_Click(object sender, EventArgs e)
    {
        region region = new region();
        if (region.Del(Val(Request["num"])))
        {
            Response.Redirect(Request.Url.AbsolutePath + rtnQueryString("num"));
        }
        else
        {
            msg.Text = region.log;
        }
    }


    #endregion



}