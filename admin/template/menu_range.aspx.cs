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

public partial class admin_template_menu_range : ez.admin.PageBase
{
    
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

            BuildTreeView();

            int root = 0;
            if (!isStrNull(Request["num"]))
            {
                root = Val(Request["num"]);
            }

            menu menu = new menu();
            Repeater1.DataSource = menu.RowDataTable(root, nation.SelectedValue);
            Repeater1.DataBind();
        }
       
    }
    
    protected void nation_SelectedIndexChanged(object sender, EventArgs e)
    {
        Response.Redirect( Request.Url.AbsolutePath +  "?nation=" + nation.SelectedValue);
    }

    #region 產生TreeView選單

    public void BuildTreeView()
    {
        this.TreeView1.Nodes.Clear();
        BuildChild(0, this.TreeView1.Nodes, 1);
    }

    public void BuildChild(int RootUid, TreeNodeCollection Nodes, int level)
    {

        menu menu = new menu();

        bool isLastLevel = (level + 1 > menu.LevelMax);

        ArrayList Rows = menu.RowData(RootUid, nation.SelectedValue);

        foreach (menu.DataInfo info in Rows)
        {

            TreeNode newNode = new TreeNode();


            if (Val(Request["num"]) == info.num)
            {
                newNode.Text = "<b><span style=\"color:blue\">" + info.kind + "</span></b>";
            }
            else
            {
                newNode.Text = info.kind;
            }
            newNode.Value = info.num.ToString();
            newNode.NavigateUrl = Request.Url.AbsolutePath +  "?num=" + info.num.ToString() + "&nation=" + nation.SelectedValue;
            newNode.Expand();
            Nodes.Add(newNode);
            if (!isLastLevel)
            {
                BuildChild(info.num, newNode.ChildNodes, level + 1);
            }

        }


    }

    #endregion

    #region 儲存

    protected void submitButton_Click(object sender, EventArgs e)
    {
        menu menu = new menu();
        msg.Text = "";
        if (!isStrNull(sortNum.Value) && IsNumeric(sortNum.Value.Split(',')[0]))
        {
            if (menu.SaveSort(sortNum.Value.Split(',').Select(x => int.Parse(x)).ToArray()))
            {
                ScriptMsg("儲存排序成功", Request.Url.AbsoluteUri);
            }
            else
            {
                ScriptMsg("儲存排序失敗");
                msg.Text = menu.log;
            }
        }
        else
        {
            ScriptMsg("無排序資料");
        }
    }

    #endregion

  

    
}